import {build} from 'esbuild';
import {resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
const output=resolve('android/app/build/generated/ledgerAssets/native-runtime.js');
await mkdir(resolve(output,'..'),{recursive:true});
await build({entryPoints:['android/app/src/main/assets/native-engine.mjs'],bundle:true,format:'iife',target:'chrome74',outfile:output,minify:true,plugins:[{name:'shared-core',setup(b){b.onResolve({filter:/^\.\/core\//},a=>({path:resolve('web',a.path.slice(7))}));}}]});
console.log('Packaged native ledger runtime from the shared Web core.');
