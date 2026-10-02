import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await build({entryPoints:['tools/crypto-entry.js'],bundle:true,outfile:'apps-script/Crypto.gs',format:'iife',globalName:'DriveCrypto',platform:'neutral',target:'es2020',minify:true,banner:{js:'/* Vendored @noble/ciphers 2.4.0 + @noble/hashes 2.0.1, MIT. See vendor licenses. */'}});
await mkdir('apps-script/vendor',{recursive:true});
for(const p of ['ciphers','hashes'])await copyFile('node_modules/@noble/'+p+'/LICENSE','apps-script/vendor/noble-'+p+'-LICENSE');
