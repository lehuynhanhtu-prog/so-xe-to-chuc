/* Single-owner service. Only sxHealth, sxLogin, sxBootstrap and sxApi are public.
 * No Google tokens, file IDs, password hashes or data keys leave the server view.
 * The deployment owner runs initializeDeployment_ once in the editor.
 */
var crypto = {randomUUID:function(){return Utilities.getUuid();}};
var structuredClone=function(value){return JSON.parse(JSON.stringify(value));};
const CLOUD_FORMAT_='soxe-cloud-v1', CLOUD_MAX_=32*1024*1024, CLOUD_BACKUP_MAX_=64*1024*1024;
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('Sổ Xe Tổ Chức').addMetaTag('viewport','width=device-width, initial-scale=1');}
function doPost(e){
  let envelope;
  try{
    const raw=e?.postData?.contents;
    if(typeof raw!=='string'||!raw||raw.length>CLOUD_BACKUP_MAX_)throw new Error('Yêu cầu không hợp lệ hoặc vượt giới hạn.');
    const request=JSON.parse(raw),method=request?.method;
    if(method==='health')envelope={ok:true,result:sxHealth()};
    else if(method==='login')envelope={ok:true,result:sxLogin(request.request||{})};
    else if(method==='api')envelope={ok:true,result:sxApi(request.request||{})};
    else throw new Error('RPC không hợp lệ.');
  }catch(error){envelope={ok:false,error:error?.message||'Dịch vụ không xử lý được yêu cầu.'};}
  return ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.JSON);
}
function initializeDeployment_(){
  const p=PropertiesService.getScriptProperties();
  if(p.getProperty('CLOUD_KEY'))throw new Error('Dịch vụ đã khởi tạo. Giữ nguyên khóa và dữ liệu hiện có.');
  const code=base64_(random_(24));
  p.setProperties({CLOUD_KEY:base64_(random_(32)),CLOUD_SETUP:hash_(code),CLOUD_EPOCH:Utilities.getUuid()});
  console.log('Mã thiết lập một lần: '+code);
  return {ready:true};
}
function sxHealth(){const p=PropertiesService.getScriptProperties();return {version:'4.8.4-native.1',ready:!!p.getProperty('CLOUD_KEY'),initialized:!!p.getProperty('CLOUD_FILE')};}
function props_(){const p=PropertiesService.getScriptProperties();if(!p.getProperty('CLOUD_KEY'))throw new Error('Chủ app cần chạy initializeDeployment_ và cấp quyền Google trước.');return p;}
function locked_(work){const lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw new Error('Dịch vụ đang bận. Hãy thử lại.');try{return work();}finally{lock.releaseLock();}}
function text_(value,max=120,empty=false){if(typeof value!=='string'||value.length>max||!empty&&!value.trim())throw new Error('Thông tin nhập thiếu hoặc quá dài.');return value.trim();}
function number_(value,max){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new Error('Giá trị số không hợp lệ.');return value;}
function passwordPolicy_(p){if(typeof p!=='string'||p.length<6||p.length>128)throw new Error('Mật khẩu cần từ 6 đến 128 ký tự.');}
function version_(old,v){if(old&&old.version!==v)throw new Error('Bản ghi đã thay đổi. Đồng bộ lại trước khi lưu.');}
function bytes_(s){return new Uint8Array(Utilities.newBlob(s).getBytes().map(x=>x&255));}
function utf8_(b){return Utilities.newBlob(Array.from(b,x=>x>127?x-256:x)).getDataAsString();}
function base64_(b){return Utilities.base64Encode(Array.from(b));}
function unbase64_(s){if(typeof s!=='string'||! /^[A-Za-z0-9+/]*={0,2}$/.test(s))throw new Error('Dữ liệu mã hóa không hợp lệ.');return new Uint8Array(Utilities.base64Decode(s).map(x=>x&255));}
function random_(n){let result=new Uint8Array(n),offset=0;while(offset<n){const b=DriveCrypto.sha256(bytes_(Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid()));result.set(b.slice(0,Math.min(b.length,n-offset)),offset);offset+=Math.min(b.length,n-offset);}return result;}
function hash_(s){return base64_(DriveCrypto.sha256(bytes_(s)));}
function equal_(a,b){if(typeof a!=='string'||typeof b!=='string')return false;let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function kdf_(p,salt,rounds){passwordPolicy_(p);return DriveCrypto.pbkdf2(DriveCrypto.sha256,bytes_(p),unbase64_(salt),{c:rounds,dkLen:32});}
function password_(p){const salt=base64_(random_(16)),rounds=100000;return {salt,rounds,hash:base64_(kdf_(p,salt,rounds))};}
function verify_(u,p){try{if(u.legacyCredential){const a=unlock_(u.legacyCredential,p,'account');return a.userId===u.id&&a.orgId===u.legacyOrgId&&a.role===u.role;}const v=u.password;return !!v&&v.rounds===100000&&equal_(v.hash,base64_(kdf_(p,v.salt,v.rounds)));}catch{return false;}}
function open_(box,key,purpose){
  if(box?.format==='so-xe-data-v4'&&box.encoding==='json'&&box.purpose===purpose&&Object.prototype.hasOwnProperty.call(box,'data'))return structuredClone(box.data);
  if(box?.format!=='so-xe-drive-v3'||box.cipher!=='AES-256-GCM'||box.purpose!==purpose)throw new Error('Sai định dạng bản sao lưu.');
  return JSON.parse(utf8_(DriveCrypto.gcm(unbase64_(key),unbase64_(box.iv),bytes_(purpose)).decrypt(unbase64_(box.ciphertext))));
}
function unlock_(box,password,purpose,depth=0){
  if(purpose==='account'&&box?.format==='soxe-relocated-account'){
    if(depth>=8)throw new Error('Hồ sơ tài khoản chuyển quá nhiều lần.');
    const a=unlock_(box.credentials,password,purpose,depth+1),m=open_(box.relocation,a.memberKey||a.rootKey,'relocation:'+a.orgId+':'+a.userId);
    if(m.userId!==a.userId||m.orgId!==a.orgId||m.role!==a.role)throw new Error('Hồ sơ tài khoản không khớp.');return Object.assign(a,m);
  }
  if(box?.kdf!=='PBKDF2-SHA256'||![10000,100000,600000].includes(box.iterations)||unbase64_(box.salt).length!==16)throw new Error('Sai định dạng mật khẩu bản sao lưu.');
  return open_(box,base64_(kdf_(password,box.salt,box.iterations)),purpose);
}
function lockBackup_(value,p){const salt=base64_(random_(16)),iv=random_(12),key=kdf_(p,salt,100000),purpose='backup';return {format:'so-xe-drive-v3',cipher:'AES-256-GCM',purpose,iv:base64_(iv),ciphertext:base64_(DriveCrypto.gcm(key,iv,bytes_(purpose)).encrypt(bytes_(JSON.stringify(value)))),kdf:'PBKDF2-SHA256',salt,iterations:100000};}
function throttle_(name,failed=false){const c=CacheService.getScriptCache(),key='cloud-login:'+hash_(name);if(Number(c.get(key)||0)>=5)throw new Error('Đăng nhập sai nhiều lần. Thử lại sau 15 phút.');if(failed)c.put(key,String(Number(c.get(key)||0)+1),900);}
function load_(){const f=props_().getProperty('CLOUD_FILE');if(!f)throw new Error('Tổ chức chưa được thiết lập.');const file=DriveApp.getFileById(f);if(file.isTrashed())throw new Error('Dữ liệu đã bị xóa.');const db=JSON.parse(file.getBlob().getDataAsString());if(db.format!==CLOUD_FORMAT_)throw new Error('Sai định dạng dữ liệu.');if(db.deletedAt)throw new Error('Tổ chức đã bị xóa.');return db;}
function save_(db){db.updatedAt=new Date().toISOString();const value=JSON.stringify(db);if(bytes_(value).length>CLOUD_MAX_)throw new Error('Dữ liệu vượt 32 MB. Cần lưu trữ bớt lịch sử.');const file=DriveApp.getFileById(props_().getProperty('CLOUD_FILE'));try{file.setContent(value);}catch(e){try{if(file.getBlob().getDataAsString()===value)return;}catch{e.uncertain=true;}throw e;}}
function user_(db,id){const u=db.users.find(x=>x.id===id&&!x.deletedAt);if(!u)throw new Error('Tài khoản đã bị thu hồi.');return u;}
function admin_(u){if(u.role!=='admin')throw new Error('Chỉ Admin có quyền thực hiện.');}
function manages_(db,u,carId){return db.assignments.some(a=>a.carId===carId&&a.userId===u.id&&!a.endedAt);}
function issue_(db,u){const nonce=Utilities.getUuid(),exp=Date.now()+8*60*60*1000,p=props_();u.sessions=(u.sessions||[]).filter(s=>s.exp>Date.now()).slice(-9);u.sessions.push({nonce,exp});const body=base64_(bytes_(JSON.stringify({org:db.id,uid:u.id,sv:u.sessionVersion,epoch:db.sessionEpoch,nonce,exp})));return body+'.'+base64_(DriveCrypto.hmac(DriveCrypto.sha256,unbase64_(p.getProperty('CLOUD_KEY')),bytes_(body)));}
function auth_(db,token){try{if(typeof token!=='string'||token.length>4096)throw 0;const parts=token.split('.');if(parts.length!==2||!equal_(parts[1],base64_(DriveCrypto.hmac(DriveCrypto.sha256,unbase64_(props_().getProperty('CLOUD_KEY')),bytes_(parts[0])))))throw 0;const t=JSON.parse(utf8_(unbase64_(parts[0]))),u=user_(db,t.uid);if(t.org!==db.id||t.epoch!==db.sessionEpoch||t.sv!==u.sessionVersion||t.exp<Date.now()||!u.sessions?.some(s=>s.nonce===t.nonce&&s.exp>Date.now()))throw 0;return {u,t};}catch{throw new Error('Phiên đăng nhập hết hạn hoặc đã bị thu hồi. Đăng nhập lại.');}}
function view_(db,u){
  if(u.mustChange)return {organization:{id:db.id,name:db.name},me:{id:u.id,username:u.username,name:u.name,role:u.role,mustChange:true},revision:db.revision};
  const p=structuredClone(LedgerCore.projection(db,u));delete p.organization.ownerEmail;
  p.users=db.users.filter(x=>!x.deletedAt).map(x=>({id:x.id,name:x.name,username:x.username,role:x.role,active:!!x.active,editVersion:x.editVersion||0}));
  p.me={id:u.id,username:u.username,name:u.name,role:u.role,mustChange:false};
  if(u.role==='driver'){
    p.carManagementEvents=(p.assignmentEvents||[]).filter(e=>e.toUserId===u.id||e.fromUserId===u.id).map(e=>({id:e.id,kind:e.kind,carId:e.carId,fromUserId:e.fromUserId||'',toUserId:e.toUserId||'',at:e.at}));
    p.assignments=p.assignments.filter(a=>a.userId===u.id);p.assignmentEvents=[];
  }
  for(const r of [...p.cars,...p.transactions])r.attachments=(r.attachments||[]).map(f=>({id:f.id,name:f.name,type:f.type,size:f.size}));
  p.pending=0;p.conflicts=[];p.storage={model:CLOUD_FORMAT_};return p;
}
function response_(db,u,token){return {data:view_(db,u),...(token?{token}:{}),...(u.mustChange?{mustChange:true}:{})};}
function sxLogin(request){return locked_(()=>{
  const db=load_(),username=LedgerCore.normalizeUsername(text_(request.username,80));throttle_(username);
  const u=db.users.find(x=>!x.deletedAt&&x.username===username);
  let legacy=null,valid=false;
  if(u?.legacyCredential){try{legacy=unlock_(u.legacyCredential,request.password,'account');valid=legacy.userId===u.id&&legacy.orgId===u.legacyOrgId&&legacy.role===u.role;}catch{}}
  else if(u)valid=verify_(u,request.password);
  if(!valid){throttle_(username,true);throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');}
  if(legacy){u.mustChange=!!legacy.mustChange;u.password=password_(request.password);delete u.legacyCredential;delete u.legacyOrgId;}
  CacheService.getScriptCache().remove('cloud-login:'+hash_(username));u.active=!u.mustChange;
  const token=issue_(db,u);save_(db);return response_(db,u,token);
});}
function setup_(code){const p=props_();if(p.getProperty('CLOUD_FILE'))throw new Error('Tổ chức đã tồn tại. Không ghi đè qua thiết lập.');throttle_('setup');if(!equal_(hash_(text_(code,120)),p.getProperty('CLOUD_SETUP'))){throttle_('setup',true);throw new Error('Mã thiết lập không đúng.');}}
function emptyDb_(a){return {format:CLOUD_FORMAT_,id:Utilities.getUuid(),name:text_(a.organizationName),revision:1,sessionEpoch:Utilities.getUuid(),users:[],cars:[],transactions:[],handovers:[],assignments:[],assignmentEvents:[],audit:[],operations:[],receipts:{},tombstones:[]};}
function sxBootstrap(a){return locked_(()=>{
  setup_(a.setupCode);
  if(a.action==='inspectImport'){const b=decodeBackup_(a);return {summary:summary_(b.db,b.createdAt)};}
  let db;
  if(a.action==='import'){
    const b=decodeBackup_(a);if(a.confirmation!==b.db.name)throw new Error('Nhập đúng tên tổ chức trong bản sao lưu.');
    return install_(b.db,b.files,true);
  }
  passwordPolicy_(a.password);db=emptyDb_(a);db.users.push({id:Utilities.getUuid(),username:'admin',name:text_(a.adminName,80),role:'admin',password:password_(a.password),sessionVersion:1,mustChange:false,active:true,editVersion:0,sessions:[]});
  install_(db,[],false);return {created:true};
});}
function install_(db,binaries,imported){
  const p=props_(),folder=DriveApp.createFolder('Sổ Xe Tổ Chức · một Google'),created=[];
  try{const next=prepareDb_(db);materialize_(next,binaries,folder,created);const file=folder.createFile('so-xe-cloud.json',JSON.stringify(next),MimeType.PLAIN_TEXT);created.push(file.getId());p.setProperties({CLOUD_FILE:file.getId(),CLOUD_FOLDER:folder.getId()});p.deleteProperty('CLOUD_SETUP');return {imported,created:!imported,summary:summary_(next)};}
  catch(e){for(const id of created)try{DriveApp.getFileById(id).setTrashed(true);}catch{}try{folder.setTrashed(true);}catch{}throw e;}
}
function prepareDb_(db){const next=structuredClone(db);next.format=CLOUD_FORMAT_;next.sessionEpoch=Utilities.getUuid();next.ownerEmail='';next.storage={model:CLOUD_FORMAT_};next.operations=[];next.receipts={};next.revision=(next.revision||0)+1;next.audit=next.audit||[];next.tombstones=next.tombstones||[];next.handovers=next.handovers||[];
  for(const u of next.users){u.sessionVersion=(u.sessionVersion||0)+1;u.sessions=[];for(const k of ['email','profileId','journalId','viewId','viewOwnerEmail','memberKey','inviteToken','passwordEpoch','resetHash'])delete u[k];}
  if(bytes_(JSON.stringify(next)).length>CLOUD_MAX_)throw new Error('Dữ liệu vượt 32 MB.');return next;
}
function summary_(db,createdAt){return {organizationName:db.name,createdAt:createdAt||db.updatedAt||new Date().toISOString(),cars:db.cars.length,transactions:db.transactions.length,users:db.users.filter(u=>!u.deletedAt).length,attachments:[...db.cars,...db.transactions].reduce((n,r)=>n+(r.attachments||[]).length,0),complete:true};}
function attachmentRefs_(db){return [...db.cars,...db.transactions].flatMap(r=>r.attachments||[]);}
function validateDb_(db){
  if(!db||!['soxe-org-v3',CLOUD_FORMAT_].includes(db.format)||db.deletedAt||!['users','cars','transactions','assignments'].every(k=>Array.isArray(db[k]))||typeof db.id!=='string'||typeof db.name!=='string')throw new Error('Bản sao lưu không hợp lệ.');
  const ids=new Set(),names=new Set();for(const u of db.users){if(typeof u.id!=='string'||ids.has(u.id)||!['admin','viewer','driver'].includes(u.role))throw new Error('Danh sách tài khoản không hợp lệ.');ids.add(u.id);if(!u.deletedAt){u.username=LedgerCore.validateUsername(u.username);if(names.has(u.username))throw new Error('Trùng tên đăng nhập trong bản sao lưu.');names.add(u.username);}}
  if(!db.users.some(u=>!u.deletedAt&&u.role==='admin'))throw new Error('Bản sao lưu thiếu Admin.');
  const cars=new Set();for(const c of db.cars){if(typeof c.id!=='string'||cars.has(c.id))throw new Error('Trùng xe trong bản sao lưu.');cars.add(c.id);}
  const tx=new Set();for(const t of db.transactions){if(tx.has(t.id)||!cars.has(t.carId)||!ids.has(t.enteredBy))throw new Error('Giao dịch tham chiếu không hợp lệ.');tx.add(t.id);}
  for(const r of [...db.cars,...db.transactions]){if(!Array.isArray(r.attachments||[])||(r.attachments||[]).length>5)throw new Error('Danh sách tệp không hợp lệ.');}
}
function decodeBackup_(a){
  if(typeof a.backup!=='string'||a.backup.length>CLOUD_BACKUP_MAX_)throw new Error('Bản sao lưu tối đa 64 MB.');
  let b;try{b=unlock_(JSON.parse(a.backup),a.password,'backup');}catch{throw new Error('Mật khẩu bản sao lưu sai hoặc tệp bị hỏng.');}
  const db=b.db;validateDb_(db);if(!Array.isArray(b.files))throw new Error('Cần bản sao lưu đầy đủ có tài khoản và tệp đính kèm.');
  const map=new Map();for(const f of b.files){if(!f||typeof f.id!=='string'||map.has(f.id))throw new Error('Trùng tệp sao lưu.');map.set(f.id,f);}
  if(db.format==='soxe-org-v3'){
    if(b.format!=='soxe-organization-backup'||b.version!==1||db.storage?.model!=='two-google-v2'||b.account?.orgId!==db.id)throw new Error('Cần bản sao lưu đầy đủ từ 4.8.3 hai Google.');
    const root=map.get(b.account.rootId);if(!root||JSON.stringify(open_(root.box,b.account.rootKey,'organization:'+db.id))!==JSON.stringify(db))throw new Error('Dữ liệu tổ chức và bản sao lưu không khớp.');
    for(const u of db.users.filter(u=>!u.deletedAt)){
      const f=map.get(u.profileId)||b.files.find(f=>f.appProperties?.kind==='account'&&f.appProperties.userId===u.id);
      if(!f?.box||f.appProperties?.userId!==u.id)throw new Error('Thiếu hồ sơ tài khoản '+u.username+'.');
      u.legacyCredential=f.box;u.legacyOrgId=db.id;delete u.password;
      if(u.journalId){const j=map.get(u.journalId);if(!j?.box)throw new Error('Thiếu nhật ký '+u.username+'.');const journal=open_(j.box,u.memberKey,'journal:'+db.id+':'+u.id),seen=new Set((db.receipts?.[u.id]||[]).map(x=>x.id));if(journal.userId!==u.id||journal.orgId!==db.id||(journal.events||[]).some(e=>!seen.has(e.id)))throw new Error('Còn thao tác chưa đồng bộ. Mở Admin bản cũ và sao lưu lại.');}
    }
  }else if(b.format!=='soxe-cloud-backup'||b.version!==1)throw new Error('Sai phiên bản sao lưu.');
  for(const u of db.users.filter(u=>!u.deletedAt))if(!u.legacyCredential&&(!u.password||u.password.rounds!==100000))throw new Error('Thiếu thông tin đăng nhập '+u.username+'.');
  for(const f of attachmentRefs_(db)){
    const saved=f.driveFileId?map.get(f.driveFileId):null,base64=saved?.binary||f.base64;
    if(f.driveFileId&&(!saved||saved.attachmentId!==f.id)||typeof base64!=='string'||unbase64_(base64).length>2*1024*1024)throw new Error('Thiếu hoặc sai tệp '+f.name+'.');
  }
  return {db,files:b.files,createdAt:b.createdAt};
}
function materialize_(db,files,folder,created){const map=new Map(files.map(f=>[f.id,f])),names=new Set();for(const r of [...db.cars,...db.transactions])for(const f of r.attachments||[]){const old=f.driveFileId,saved=map.get(old),base64=saved?.binary||f.base64,type=f.type||saved?.type||'application/octet-stream';const car=db.cars.includes(r)?r:db.cars.find(c=>c.id===r.carId),isCar=db.cars.includes(r),date=isCar?(f.namingDate||LedgerCore.attachmentToday()):r.date,stem=LedgerCore.attachmentStem({plate:car.plate,category:isCar?'ownership':r.category,date}),original=f.originalName||f.name;f.name=LedgerCore.uniqueAttachmentName(stem,original,names,f.name);names.add(f.name.toLocaleLowerCase('vi-VN'));const file=folder.createFile(Utilities.newBlob(Array.from(unbase64_(base64)),type,f.name));created.push(file.getId());f.driveFileId=file.getId();f.size=unbase64_(base64).length;f.type=type;f.namingDate=date;f.originalName=original;delete f.base64;}}
function file_(db,u,a){const p=view_(db,u),r=a.transactionId?p.transactions.find(t=>t.id===a.transactionId):p.cars.find(c=>c.id===a.carId);if(!r?.attachments?.some(f=>f.id===a.id))throw new Error('Không có quyền xem tệp.');const full=a.transactionId?db.transactions.find(t=>t.id===a.transactionId):db.cars.find(c=>c.id===a.carId),f=full.attachments.find(f=>f.id===a.id);return {file:{id:f.id,name:f.name,type:f.type,size:f.size,base64:base64_(DriveApp.getFileById(f.driveFileId).getBlob().getBytes().map(x=>x&255))}};}
function requireRecord_(db,u,action,a){
  if(u.role==='viewer')throw new Error('Tài khoản chỉ xem không được ghi dữ liệu.');
  if(u.role==='admin')return;
  if(!['saveTransaction','deleteTransaction','saveHandover','deleteHandover'].includes(action))throw new Error('Không có quyền thực hiện.');
  const old=action.includes('Transaction')?db.transactions.find(t=>t.id===a.id):db.handovers.find(h=>h.id===a.id),carId=old?.carId||a.carId;
  if(!manages_(db,u,carId))throw new Error('Chỉ được thao tác khi đang quản lý xe.');
  if(old&&old.enteredBy!==u.id)throw new Error('Chỉ được sửa/xóa bản ghi do mình nhập.');
  if(old&&a.carId&&a.carId!==old.carId)throw new Error('Không chuyển bản ghi sang xe khác.');
}
function attachments_(db,input,old,record,isCar,created){
  if(!Array.isArray(input)||input.length>5)throw new Error('Tối đa 5 tệp mỗi bản ghi.');
  const folder=DriveApp.getFolderById(props_().getProperty('CLOUD_FOLDER')),seen=new Set(),used=new Set(attachmentRefs_(db).filter(f=>!old.some(o=>o.id===f.id)).map(f=>f.name.toLocaleLowerCase('vi-VN'))),car=isCar?record:db.cars.find(c=>c.id===record.carId);
  return input.map(f=>{
    let next;
    if(f.id){if(seen.has(f.id)||!old.some(o=>o.id===f.id))throw new Error('Tệp không thuộc bản ghi.');seen.add(f.id);next=structuredClone(old.find(o=>o.id===f.id));}
    else{if(f.driveFileId)throw new Error('Không nhập mã tệp bên ngoài.');const original=text_(f.name,200),data=unbase64_(f.base64);if(data.length>2*1024*1024)throw new Error('Tệp vượt 2 MB.');next={id:Utilities.getUuid(),name:original,originalName:original,type:text_(f.type||'application/octet-stream',100),size:data.length};const file=folder.createFile(Utilities.newBlob(Array.from(data),next.type,original));created.push(file.getId());next.driveFileId=file.getId();}
    const date=isCar?(next.namingDate||LedgerCore.attachmentToday()):record.date,stem=LedgerCore.attachmentStem({plate:car.plate,category:isCar?'ownership':record.category,date}),original=next.originalName||next.name;
    next.name=LedgerCore.uniqueAttachmentName(stem,original,used,next.name);used.add(next.name.toLocaleLowerCase('vi-VN'));next.originalName=original;next.namingDate=date;return next;
  });
}
function mutate_(db,u,action,a,created){
  requireRecord_(db,u,action,a);
  switch(action){
    case 'renameOrganization':admin_(u);db.name=text_(a.name);break;
    case 'createUser':{
      admin_(u);const username=LedgerCore.validateUsername(a.username);if(db.users.some(x=>!x.deletedAt&&x.username===username))throw new Error('Tên đăng nhập đã dùng.');if(!['admin','viewer','driver'].includes(a.role))throw new Error('Vai trò không hợp lệ.');passwordPolicy_(a.initialPassword);
      const nu={id:Utilities.getUuid(),name:text_(a.name,80),username,role:a.role,password:password_(a.initialPassword),mustChange:true,active:false,sessionVersion:1,editVersion:0,sessions:[]};db.users.push(nu);return {createdUserId:nu.id};
    }
    case 'editUser':{
      admin_(u);const t=user_(db,a.id),username=LedgerCore.validateUsername(a.username);if(a.version!==(t.editVersion||0))throw new Error('Thông tin NSD đã thay đổi. Đồng bộ lại.');if(db.users.some(x=>x.id!==t.id&&!x.deletedAt&&x.username===username))throw new Error('Tên đăng nhập đã dùng.');
      if(a.newPassword){if(t.id===u.id)throw new Error('Dùng chức năng Đổi mật khẩu cho tài khoản hiện tại.');t.password=password_(a.newPassword);delete t.legacyCredential;delete t.legacyOrgId;t.mustChange=true;t.active=false;t.sessionVersion++;t.sessions=[];}
      t.username=username;t.name=text_(a.name,80);t.editVersion=(t.editVersion||0)+1;break;
    }
    case 'deleteUser':{
      admin_(u);const t=user_(db,a.id);if(t.id===u.id||t.id===db.users.find(x=>!x.deletedAt&&x.role==='admin')?.id)throw new Error('Không xóa Admin chính hoặc tài khoản hiện tại.');
      if(t.hasAssignments||db.assignments.some(x=>x.userId===t.id)||db.transactions.some(x=>x.enteredBy===t.id||x.enteredFor===t.id)||db.handovers.some(x=>[x.enteredBy,x.fromUserId,x.toUserId].includes(t.id))||db.audit.some(x=>x.actor===t.id))throw new Error('NSD đã có lịch sử. Không xóa để bảo toàn dữ liệu.');t.deletedAt=new Date().toISOString();t.sessionVersion++;t.sessions=[];break;
    }
    case 'saveCar':{
      admin_(u);const old=a.id?db.cars.find(x=>x.id===a.id):null;if(a.id&&!old)throw new Error('Xe đã xóa.');version_(old,a.version);const plate=text_(a.plate,30).toUpperCase();if(db.cars.some(c=>c.plate===plate&&c.id!==a.id))throw new Error('Biển số đã tồn tại.');
      const c={id:old?.id||Utilities.getUuid(),plate,name:text_(a.name,100),odo:number_(a.odo,1e7),year:text_(String(a.year||''),4,true),powerType:['fuel','electric','hybrid'].includes(a.powerType)?a.powerType:'fuel',version:(old?.version||0)+1};c.attachments=attachments_(db,a.attachments||[],old?.attachments||[],c,true,created);db.cars=db.cars.filter(x=>x.id!==c.id);db.cars.push(c);break;
    }
    case 'deleteCar':{
      admin_(u);const c=db.cars.find(x=>x.id===a.id);if(!c)throw new Error('Xe đã xóa.');version_(c,a.version);if(a.confirmation!==c.plate)throw new Error('Nhập đúng biển số để xóa.');db.cars=db.cars.filter(x=>x.id!==c.id);db.transactions=db.transactions.filter(x=>x.carId!==c.id);db.handovers=db.handovers.filter(x=>x.carId!==c.id);db.assignments=db.assignments.filter(x=>x.carId!==c.id);if(db.assignmentEvents)db.assignmentEvents=db.assignmentEvents.filter(x=>x.carId!==c.id);break;
    }
    case 'assign':admin_(u);LedgerCore.assignVehicle(db,u,a);break;
    case 'saveHandover':LedgerCore.mutateHandover(db,u,a);break;
    case 'deleteHandover':LedgerCore.mutateHandover(db,u,a,true);break;
    case 'saveTransaction':{
      const old=a.id?db.transactions.find(x=>x.id===a.id):null;
      // Validate all business fields and permissions before creating Drive files.
      const t=LedgerCore.transaction(db,u,Object.assign({},a,{attachments:[]}));t.attachments=attachments_(db,a.attachments||[],old?.attachments||[],t,false,created);db.transactions=db.transactions.filter(x=>x.id!==t.id);db.transactions.push(t);break;
    }
    case 'deleteTransaction':{const t=db.transactions.find(x=>x.id===a.id);if(!t)throw new Error('Giao dịch đã xóa.');version_(t,a.version);db.transactions=db.transactions.filter(x=>x.id!==t.id);db.tombstones.push({id:t.id,version:t.version+1,at:new Date().toISOString()});break;}
    default:throw new Error('Thao tác không được hỗ trợ.');
  }
  return {};
}
function syncFileNames_(db,before,warnings){const prior=new Map(before.map(f=>[f.driveFileId,f.name]));for(const f of attachmentRefs_(db).filter(f=>prior.get(f.driveFileId)!==f.name))try{const file=DriveApp.getFileById(f.driveFileId);if(file.getName()!==f.name)file.setName(f.name);}catch{warnings.push('Đã lưu dữ liệu nhưng chưa đồng bộ được tên tệp '+f.name);}}
function export_(db,a){admin_(a.u);const files=[];for(const f of attachmentRefs_(db))if(!files.some(x=>x.id===f.driveFileId))files.push({id:f.driveFileId,attachmentId:f.id,name:f.name,type:f.type,binary:base64_(DriveApp.getFileById(f.driveFileId).getBlob().getBytes().map(x=>x&255))});const copy=structuredClone(db);for(const u of copy.users)u.sessions=[];const value={format:'soxe-cloud-backup',version:1,createdAt:new Date().toISOString(),db:copy,files};if(JSON.stringify(value).length>CLOUD_BACKUP_MAX_/2)throw new Error('Bản sao lưu quá lớn cho dịch vụ này.');return {backup:JSON.stringify(lockBackup_(value,a.password)),summary:summary_(db,value.createdAt)};}
function sxApi(request){return locked_(()=>{
  const db=load_(),auth=auth_(db,request.token),u=auth.u,action=request.action,a=request.args||{};
  if(action==='logout'){u.sessions=u.sessions.filter(s=>s.nonce!==auth.t.nonce);save_(db);return {loggedOut:true};}
  if(action==='changePassword'){
    if(!verify_(u,a.currentPassword))throw new Error('Mật khẩu hiện tại không đúng.');if(a.password===a.currentPassword)throw new Error('Chọn mật khẩu mới khác mật khẩu hiện tại.');u.password=password_(a.password);delete u.legacyCredential;delete u.legacyOrgId;u.mustChange=false;u.active=true;u.sessionVersion++;u.sessions=[];const token=issue_(db,u);db.revision++;save_(db);return response_(db,u,token);
  }
  if(u.mustChange)throw new Error('Đổi mật khẩu lần đầu trước khi sử dụng.');
  if(action==='verifyPassword'){if(!verify_(u,a.password))throw new Error('Mật khẩu không đúng.');return {verified:true,userId:u.id,orgId:db.id};}
  if(action==='read')return response_(db,u);
  if(action==='attachment')return file_(db,u,a);
  if(action==='export')return export_(db,Object.assign({},a,{u}));
  if(action==='inspectBackup'){admin_(u);const b=decodeBackup_(a);if(b.db.id!==db.id)throw new Error('Bản sao lưu thuộc tổ chức khác.');return {summary:summary_(b.db,b.createdAt)};}
  if(action==='restoreBackup'){
    admin_(u);if(a.confirmation!==db.name||!verify_(u,a.adminPassword))throw new Error('Tên tổ chức hoặc mật khẩu Admin không đúng.');if(a.expectedRevision!==db.revision)throw new Error('Dữ liệu đã thay đổi. Kiểm tra lại trước khi phục hồi.');const b=decodeBackup_(a);if(b.db.id!==db.id)throw new Error('Bản sao lưu thuộc tổ chức khác.');
    const next=prepareDb_(b.db),created=[];next.revision=Math.max(db.revision,next.revision)+1;for(const key of ['cars','transactions','handovers'])for(const r of next[key]||[])r.version=Math.max(r.version||0,db[key]?.find(x=>x.id===r.id)?.version||0)+1;
    try{materialize_(next,b.files,DriveApp.getFolderById(props_().getProperty('CLOUD_FOLDER')),created);save_(next);}catch(e){if(!e.uncertain)for(const id of created)try{DriveApp.getFileById(id).setTrashed(true);}catch{}throw e;}
    const warnings=[];for(const f of attachmentRefs_(db))try{DriveApp.getFileById(f.driveFileId).setTrashed(true);}catch{warnings.push('Chưa dọn được tệp cũ '+f.name);}return {restored:true,summary:summary_(next,b.createdAt),warnings};
  }
  if(action==='deleteOrganization'){
    admin_(u);if(a.confirmation!==db.name||!verify_(u,a.password))throw new Error('Tên tổ chức hoặc mật khẩu không đúng.');
    db.deletedAt=new Date().toISOString();db.sessionEpoch=Utilities.getUuid();save_(db);return {deleted:true};
  }
  if(db.deletedAt)throw new Error('Tổ chức đã bị xóa.');
  if(typeof a.operationId!=='string'||! /^[0-9a-f-]{36}$/i.test(a.operationId))throw new Error('Thiếu mã thao tác.');
  const digest=hash_(JSON.stringify({action,args:a})),previous=db.operations.find(o=>o.id===a.operationId);
  if(previous){if(previous.actor!==u.id||previous.hash!==digest)throw new Error('Mã thao tác đã dùng cho nội dung khác.');return Object.assign(response_(db,u),previous.extra);}
  requireRecord_(db,u,action,a);
  const before=attachmentRefs_(db),created=[];let committed=false;
  try{
    const extra=mutate_(db,u,action,a,created);db.revision++;db.audit.push({id:Utilities.getUuid(),actor:u.id,action,at:new Date().toISOString()});
    if(db.operations.length>=20000)throw new Error('Đạt giới hạn lịch sử thao tác. Cần lưu trữ trước khi nhập tiếp.');db.operations.push({id:a.operationId,actor:u.id,hash:digest,extra});save_(db);committed=true;
    const warnings=[],keep=new Set(attachmentRefs_(db).map(f=>f.driveFileId));for(const f of before)if(!keep.has(f.driveFileId))try{DriveApp.getFileById(f.driveFileId).setTrashed(true);}catch{warnings.push('Chưa dọn được tệp '+f.name);}syncFileNames_(db,before,warnings);return Object.assign(response_(db,u),extra,{warnings});
  }catch(e){if(!committed&&!e.uncertain)for(const id of created)try{DriveApp.getFileById(id).setTrashed(true);}catch{}throw e;}
});}
