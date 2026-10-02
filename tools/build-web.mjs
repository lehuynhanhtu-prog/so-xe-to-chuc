import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
await mkdir('docs',{recursive:true});
for(const p of ['index.html','crypto.mjs','drive.mjs','service.mjs','google.mjs','google-config.js'])await copyFile('web/'+p,'docs/'+p);
await writeFile('docs/sw.js',`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),self.registration.unregister()])));`);
