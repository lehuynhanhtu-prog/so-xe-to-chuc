export const MODEL='two-google-v1';
const fail=m=>{throw new Error(m);};
// Tokens stay on the two GoogleConnection instances, never in a file or localStorage.
export class DualDrive{
 constructor(primary,secondary,primaryEmail,secondaryEmail){if(!secondary)fail('Cần kết nối TK2.');if(primary&&primaryEmail.toLowerCase()===secondaryEmail.toLowerCase())fail('TK2 phải khác tài khoản lưu dữ liệu Admin.');this.primary=primary;this.secondary=secondary;this.primaryEmail=primaryEmail?.toLowerCase();this.secondaryEmail=secondaryEmail.toLowerCase();this.sources=new Map();this.profileTarget=primary?'admin':'member';}
 async files(source){const drive=source==='admin'?this.primary:this.secondary;if(!drive)return [];const files=await drive.modelFiles(MODEL);for(const f of files)this.sources.set(f.id,source);return files;}
 async profiles(){const files=await this.files(this.primary?'admin':'member');return files.filter(f=>f.appProperties?.kind==='account');}
 async memberProfiles(){return (await this.files('member')).filter(f=>f.appProperties?.kind==='account');}
 async source(id){if(this.sources.has(id))return this.sources.get(id);for(const source of ['member','admin']){const drive=source==='admin'?this.primary:this.secondary;if(!drive)continue;try{const f=await drive.fileInfo(id);if(f.appProperties?.model!==MODEL||!f.owners?.some(o=>o.emailAddress?.toLowerCase()===(source==='admin'?this.primaryEmail:this.secondaryEmail)))continue;this.sources.set(id,source);return source;}catch(e){if(![403,404].includes(e.status))throw e;}}fail('File không thuộc mô hình hai tài khoản Google hoặc chưa có quyền truy cập.');}
 driver(source){const drive=source==='admin'?this.primary:this.secondary;if(!drive)fail('Admin bổ sung cần kết nối tài khoản Google lưu dữ liệu Admin trước.');return drive;}
 async create(name,box,kind,properties={}){const source=kind==='organization'||kind==='backup'?'admin':kind==='account'?this.profileTarget:'member',drive=this.driver(source);drive.folderRole=source==='admin'?'admin':'member';const result=await drive.create(name,box,kind,{...properties,model:MODEL,...(this.batchId?{migrationBatch:this.batchId}:{})});this.sources.set(result.id,source);return result;}
 async meta(id){const source=await this.source(id);return {...await this.driver(source).meta(id),storageSource:source,storageEmail:source==='admin'?this.primaryEmail:this.secondaryEmail};}
 async read(id){const source=await this.source(id),r=await this.driver(source).read(id);return {...r,meta:{...r.meta,storageSource:source,storageEmail:source==='admin'?this.primaryEmail:this.secondaryEmail}};}
 async write(id,box,etag){return this.driver(await this.source(id)).write(id,box,etag);}
 async trash(id){return this.driver(await this.source(id)).trash(id);}
 // All these files belong to the connected storage accounts: no email sharing required.
 async share(){} async revoke(){}
 async prepare(){if(this.primary){this.primary.folderRole='admin';await this.primary.ensureFolder('admin');}this.secondary.folderRole='member';await this.secondary.ensureFolder('member');}
 validate(account){if(account.model!==MODEL)fail('Đây là dữ liệu cũ. Dùng chức năng chuyển đổi hoặc mở bản cũ.');if(account.secondaryEmail!==this.secondaryEmail)fail('Bạn kết nối sai TK2. TK2 đã đăng ký: '+account.secondaryEmail);if(account.role==='admin'&&(!this.primary||account.ownerEmail!==this.primaryEmail))fail('Cần kết nối đúng Google lưu dữ liệu Admin: '+account.ownerEmail);}
}
