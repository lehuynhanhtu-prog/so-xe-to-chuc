import {readFileSync} from 'node:fs';
import vm from 'node:vm';
for(const path of ['apps-script/Code.gs','apps-script/Crypto.gs'])new vm.Script(readFileSync(path,'utf8'),{filename:path});
const html=readFileSync('apps-script/Index.html','utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1],{filename:'Index.html'});
console.log('Apps Script and browser JavaScript parse successfully.');
