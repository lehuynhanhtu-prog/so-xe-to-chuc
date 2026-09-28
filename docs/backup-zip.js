// A small uncompressed ZIP writer for offline browser and Android WebView backups.
async function makeBackupZip(entries){
  const encoder=new TextEncoder(),parts=[],directory=[];
  const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
  let offset=0;
  for(const entry of entries){
    const name=encoder.encode(entry.path),blob=entry.data instanceof Blob?entry.data:new Blob([entry.data]);
    if(name.length>65535||blob.size>0xffffffff||offset+blob.size+name.length+30>0xffffffff)throw new Error('Bản sao lưu quá lớn để tạo ZIP trên trình duyệt.');
    const bytes=new Uint8Array(await blob.arrayBuffer());
    let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
    const local=new ArrayBuffer(30+name.length),lh=new DataView(local);
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x800,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,blob.size,true);lh.setUint32(22,blob.size,true);
    lh.setUint16(26,name.length,true);new Uint8Array(local,30).set(name);
    parts.push(local,blob);
    const central=new ArrayBuffer(46+name.length),ch=new DataView(central);
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);
    ch.setUint16(8,0x800,true);ch.setUint32(16,crc,true);
    ch.setUint32(20,blob.size,true);ch.setUint32(24,blob.size,true);
    ch.setUint16(28,name.length,true);ch.setUint32(42,offset,true);
    new Uint8Array(central,46).set(name);directory.push(central);
    offset+=local.byteLength+blob.size;
  }
  const directorySize=directory.reduce((sum,entry)=>sum+entry.byteLength,0);
  if(entries.length>65535||offset+directorySize>0xffffffff)throw new Error('Bản sao lưu quá lớn để tạo ZIP trên trình duyệt.');
  const end=new ArrayBuffer(22),view=new DataView(end);
  view.setUint32(0,0x06054b50,true);view.setUint16(8,entries.length,true);
  view.setUint16(10,entries.length,true);view.setUint32(12,directorySize,true);
  view.setUint32(16,offset,true);
  return new Blob([...parts,...directory,end],{type:'application/zip'});
}
function backupFilePath(id,name){
  const safe=String(name||'tep-dinh-kem').replace(/[\\/\x00-\x1f\x7f]/g,'_').slice(0,120)||'tep-dinh-kem';
  return 'So xe/'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+safe;
}
