const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const crypto=require('node:crypto');
const bundledCrypto=Function(fs.readFileSync('apps-script/Crypto.gs','utf8')+'; return DriveCrypto;')();
function service(){
  const props=new Map(),cache=new Map(),files=new Map(),folders=new Map(),folderId='testSharedFolder12345';
  let locked=false,acquisitions=0;
  const iterator=list=>({hasNext:()=>list.length>0,next:()=>list.shift()});
  function makeFolder(id){const folder={getId:()=>id,isTrashed:()=>false,getFilesByName:n=>iterator([...files.values()].filter(f=>!f.trashed&&f.folder===id&&f.name===n)),createFile(n,content){const f={id:crypto.randomUUID(),name:n,content,folder:id,trashed:false,getId(){return this.id},isTrashed(){return this.trashed},getBlob(){return {getDataAsString:()=>this.content}},setContent(t){this.content=t},setTrashed(t){this.trashed=t},moveTo(target){this.folder=target.getId()}};files.set(f.id,f);return f}};folders.set(id,folder);return folder;}
  makeFolder(folderId);makeFolder('anotherfolder12345');
  const properties={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),setProperties:p=>Object.entries(p).forEach(([k,v])=>props.set(k,v)),deleteProperty:k=>props.delete(k)};
  const context={DriveCrypto:bundledCrypto,Uint8Array,Uint32Array,Int32Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,console:{log(){}},
    PropertiesService:{getScriptProperties:()=>properties},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
    Utilities:{getUuid:()=>crypto.randomUUID(),base64Encode:b=>Buffer.from(b).toString('base64'),base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:v=>{const b=typeof v==='string'?Buffer.from(v):Buffer.from(v);return {getBytes:()=>[...b],getDataAsString:()=>b.toString('utf8')}}},
    LockService:{getScriptLock:()=>({tryLock(){assert.equal(locked,false);locked=true;acquisitions++;return true},releaseLock(){locked=false}})},
    DriveApp:{getFolderById:id=>{if(!folders.has(id))throw new Error('No folder access');return folders.get(id)},getFileById:id=>{if(!files.has(id))throw new Error('No file');return files.get(id)}},
    ScriptApp:{getService:()=>({getUrl:()=> 'https://script.google.com/macros/s/test/exec'})},MimeType:{PLAIN_TEXT:'text/plain'}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('apps-script/Code.gs','utf8'),context);
  context.initializeDeployment_();
  const setup=crypto.randomBytes(24).toString('base64url');properties.setProperty('SX_SETUP_HASH',context.hash_(setup));
  const boot={setupCode:setup,initialPassword:'123456',folderUrl:'https://drive.google.com/drive/folders/'+folderId,password:crypto.randomBytes(24).toString('base64url'),adminName:'Admin Tu',organizationName:'Test Organization'};
  const invoke=(token,action,args={})=>context.api({token,action,args});
  return {context,props,cache,files,folders,boot,invoke,get locked(){return locked},get acquisitions(){return acquisitions}};
}
module.exports={service};
