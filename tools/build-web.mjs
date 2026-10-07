import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,12),versions={};
await mkdir('docs',{recursive:true});
function versionImports(source){return source.replace(/(['"])\.\/([^'"]+\.mjs)\1/g,(match,quote,name)=>{if(!versions[name])throw new Error('Dependency not built: '+name);return quote+'./'+name+'?v='+versions[name]+quote;});}
for(const name of ['money-input.mjs','crypto.mjs','dates.mjs','calendar.mjs','identity.mjs','handovers.mjs','drive.mjs','service.mjs','dual-drive.mjs','dual-service.mjs','reports.mjs','reminders.mjs','ledger-view.mjs','gmail.mjs','google.mjs']){const source=versionImports(await readFile('web/'+name,'utf8'));versions[name]=hash(source);await writeFile('docs/'+name,source);}
const config=await readFile('web/google-config.js','utf8');versions['google-config.js']=hash(config);await writeFile('docs/google-config.js',config);
const buildId=hash(JSON.stringify(versions));let html=versionImports(await readFile('web/index.html','utf8')).replace('src="google-config.js"','src="google-config.js?v='+versions['google-config.js']+'"').replace('Phiên bản 4.6 ·','Phiên bản 4.6 · Mã bản '+buildId+' ·');await writeFile('docs/index.html',html);
await writeFile('docs/legacy-drive-v3.html',versionImports(await readFile('web/legacy-drive-v3.html','utf8')).replace('src="google-config.js"','src="google-config.js?v='+versions['google-config.js']+'"').replace('Phiên bản 3.0 ·','Phiên bản 3.1 (bản cũ) ·'));
await writeFile('docs/sw.js',`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),self.registration.unregister()])));`);
