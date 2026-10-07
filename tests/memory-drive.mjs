export class MemoryDrive{
 constructor(email,files=new Map()){this.email=email;this.files=files;this.grants=new Set();this.folders=new Map();this.folderRole='admin';}
 file(id,write=false){const f=this.files.get(id);if(!f||f.trashed)throw Object.assign(new Error('missing'),{status:404});if(f.owner!==this.email&&(!f.permissions.has(this.email)||!this.grants.has(id)||write&&f.permissions.get(this.email)!=='writer'))throw Object.assign(new Error('permission'),{status:403});return f;}
 async ensureFolder(role=this.folderRole){this.folderRole=role;if(!this.folders.has(role))this.folders.set(role,crypto.randomUUID());return this.folders.get(role);}
 async organizeOwned(role,address,ids){const folder=await this.ensureFolder(role);for(const id of ids){const f=this.files.get(id);if(f?.owner===address)f.parent=folder;}}
 async create(name,box,kind,appProperties={}){const id=crypto.randomUUID();this.files.set(id,{id,name,parent:await this.ensureFolder(),box:structuredClone(box),kind,appProperties:{...appProperties,kind},owner:this.email,permissions:new Map(),rev:1});return {id};}
 async read(id){const f=this.files.get(id);if(!f||f.owner!==this.email&&!f.permissions.has(this.email))throw Object.assign(new Error("missing"),{status:404});return {box:structuredClone(f.box),etag:String(f.rev),meta:await this.meta(id)};}
 async meta(id){const f=this.files.get(id);if(!f||f.owner!==this.email&&!f.permissions.has(this.email))throw Object.assign(new Error("missing"),{status:404});return {etag:String(f.rev),owners:[{emailAddress:f.owner}],labels:{trashed:!!f.trashed}};}
 async write(id,box,etag){const f=this.file(id,true);if(String(f.rev)!==etag)throw Object.assign(new Error('conflict'),{status:412});f.box=structuredClone(box);f.rev++;return {id,etag:String(f.rev)};}
 async share(id,email,role){const f=this.file(id,true);if(f.permissions.get(email)!==role){f.permissions.set(email,role);f.rev++;}}
 async revoke(id,email){const f=this.file(id,true);f.permissions.delete(email);f.rev++;}
 async trash(id){this.file(id,true).trashed=true;}
 async renameProfile(id,username,name){const f=this.file(id,true);f.name=name;f.appProperties.username=username;}
 async modelFiles(model){return [...this.files.values()].filter(f=>f.owner===this.email&&!f.trashed&&f.appProperties.model===model);}
 async fileInfo(id){const f=this.files.get(id);if(!f||f.owner!==this.email&&!f.permissions.has(this.email))throw Object.assign(new Error("missing"),{status:404});return {id:f.id,name:f.name,appProperties:f.appProperties,mimeType:f.type,owners:[{emailAddress:f.owner}]};}
 async profiles(){return [...this.files.values()].filter(f=>f.owner===this.email&&!f.trashed&&f.kind==='account');}
 async createBinary(name,base64,type,properties){const r=await this.create(name,null,'attachment',properties);Object.assign(this.files.get(r.id),{base64,type});return r;}
 async readBinary(id){const f=this.files.get(id);if(!f||f.owner!==this.email)throw Object.assign(new Error('missing'),{status:404});return Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));}
 async writeBinary(id,bytes,type,etag){const f=this.file(id,true);if(String(f.rev)!==etag)throw Object.assign(new Error('conflict'),{status:412});f.base64=btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));f.type=type;return {id,etag:String(++f.rev)};}
 async writeMetadata(id,name,appProperties,etag){const f=this.file(id,true);if(String(f.rev)!==etag)throw Object.assign(new Error('conflict'),{status:412});f.name=name;f.appProperties=structuredClone(appProperties);return {etag:String(++f.rev)};}
 async setTrashed(id,trashed,etag){const f=this.files.get(id);if(!f||f.owner!==this.email)throw Object.assign(new Error('missing'),{status:404});if(String(f.rev)!==etag)throw Object.assign(new Error('conflict'),{status:412});f.trashed=trashed;return {id,etag:String(++f.rev)};}
 async pick(id){this.grants.add(id);return id;}
}
