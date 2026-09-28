// Restore ZIP archives produced by Sổ Xe, including Android's deflated ZIP files.
function restoreStatus(message){document.querySelector('#restoreStatus').textContent=message}
function readBackupData(json,manifest){
  if(!validateImported(json)||manifest?.format!=='so-xe-backup'||manifest.version!==1||!Array.isArray(manifest.files))throw new Error('ZIP không phải bản sao lưu Sổ Xe hợp lệ.');
  const files=new Map(),paths=new Set();
  for(const item of manifest.files){
    if(!item||typeof item.driveFileId!=='string'||!item.driveFileId||typeof item.path!=='string'||!item.path.startsWith('So xe/')||typeof item.name!=='string'||files.has(item.driveFileId)||paths.has(item.path))throw new Error('Danh sách tệp trong ZIP không hợp lệ.');
    files.set(item.driveFileId,item);paths.add(item.path);
  }
  for(const rec of [...json.cars,...json.expenses])for(const a of attachmentsOf(rec))if(!files.has(a.driveFileId))throw new Error('Thiếu tệp đính kèm '+(a.name||a.driveFileId)+' trong bản sao lưu.');
  return files;
}
function relinkBackupData(json,idMap){
  for(const rec of [...json.cars,...json.expenses])if(Array.isArray(rec.attachments))rec.attachments=rec.attachments.map(a=>a?.driveFileId&&idMap.has(a.driveFileId)?{...a,...idMap.get(a.driveFileId)}:a);
  return json;
}
async function saveRestoredDataToDrive(json){
  await driveFind();
  const body=JSON.stringify(json),r=driveFileId
    ?await driveFetch('https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(driveFileId)+'?uploadType=media',{method:'PATCH',headers:driveHeaders(),body})
    :await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary=soxe-restore'},body:'--soxe-restore\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify({name:DRIVE_FILE,parents:['appDataFolder'],mimeType:'application/json'})+'\r\n--soxe-restore\r\nContent-Type: application/json\r\n\r\n'+body+'\r\n--soxe-restore--'});
  if(!r.ok)throw new Error('Không lưu được dữ liệu khôi phục lên Google Drive (mã '+r.status+').');
  driveFileId=(await r.json()).id||driveFileId;
}
async function restoreBrowserBackup(file){
  if(!navigator.onLine||!token)throw new Error('Hãy kết nối Google Drive và Internet trước khi khôi phục.');
  if(syncRunning||window.restoreBusy)throw new Error('Đang đồng bộ dữ liệu. Hãy thử lại sau.');
  if(typeof JSZip==='undefined')throw new Error('Chưa tải được bộ đọc ZIP. Hãy mở lại ứng dụng.');
  restoreStatus('Đang kiểm tra tệp ZIP…');
  const zip=await JSZip.loadAsync(file,{checkCRC32:true}),dataFile=zip.file('so-xe-data.json'),manifestFile=zip.file('backup-manifest.json');
  if(!dataFile||!manifestFile)throw new Error('ZIP thiếu JSON hoặc danh sách tệp.');
  const restored=JSON.parse(await dataFile.async('string')),manifest=JSON.parse(await manifestFile.async('string')),files=readBackupData(restored,manifest);
  for(const item of files.values())if(!zip.file(item.path))throw new Error('ZIP thiếu tệp '+item.name);
  if(!confirm('Khôi phục '+restored.cars.length+' xe, '+restored.expenses.length+' giao dịch và '+files.size+' tệp? Dữ liệu hiện tại trên máy và Google Drive sẽ được thay thế. Hãy sao lưu trước khi tiếp tục.')){restoreStatus('Đã hủy khôi phục.');return}
  window.restoreBusy=true;
  const uploaded=[],idMap=new Map();let savingDrive=false;
  try{
    let done=0;
    for(const [oldId,item] of files){
      restoreStatus('Đang tải lên Drive '+(++done)+'/'+files.size+': '+item.name);
      const blob=await zip.file(item.path).async('blob');
      const fresh=await driveUploadAttachment(new File([blob],item.name,{type:item.mimeType||'application/octet-stream'}),item.name);
      uploaded.push(fresh.driveFileId);idMap.set(oldId,fresh);
    }
    relinkBackupData(restored,idMap);
    restoreStatus('Đang lưu dữ liệu lên Google Drive…');
    savingDrive=true;
    await saveRestoredDataToDrive(restored);
    data=restored;localStorage.setItem(KEY,JSON.stringify(data));dirty=false;localStorage.removeItem(DIRTY_KEY);render();
    setSync('Đã khôi phục và đồng bộ Google Drive',true);
    restoreStatus('Đã khôi phục '+files.size+' tệp và dữ liệu giao dịch.');
  }catch(error){
    if(!savingDrive)for(const id of uploaded)try{await deleteDriveAttachment(id)}catch{}
    if(savingDrive)throw new Error(error.message+' Hãy kiểm tra dữ liệu trên Drive trước khi thử lại.');
    throw error;
  }finally{window.restoreBusy=false}
}
document.querySelector('#restoreBackupFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{await restoreBrowserBackup(file)}catch(error){restoreStatus(error.message||'Khôi phục thất bại');toast(error.message||'Khôi phục thất bại')}finally{e.target.value=''}
};
