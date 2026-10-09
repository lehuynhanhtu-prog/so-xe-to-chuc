import {build} from 'esbuild';
import {resolve} from 'node:path';
import {webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
globalThis.crypto ??= webcrypto;
const bundle=await build({entryPoints:['android/app/src/main/assets/native-engine.mjs'],bundle:true,format:'esm',write:false,plugins:[{name:'shared-core',setup(b){b.onResolve({filter:/^\.\/core\//},a=>({path:resolve('web',a.path.slice(7))}));}}]});
const native=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const data={me:{id:'self',role:'driver'},cars:[{id:'car',plate:'51A',odo:1000}],users:[],carChoices:[{id:'car',plate:'51A',assignedUserId:'self'},{id:'other',plate:'OTHER',assignedUserId:'someone'}],transactions:[
{id:'own',carId:'car',enteredBy:'self',date:'2026-10-01',updatedAt:'2026-10-01',amount:123456789,odo:1000,category:'fuel',liters:10},
{id:'visible',carId:'car',enteredBy:'someone',date:'2026-10-02',updatedAt:'2026-10-02',amount:200000,odo:1100,category:'fuel',liters:5},
{id:'forbidden',carId:'other',enteredBy:'someone',date:'2026-10-01',updatedAt:'2026-10-01',amount:99999,odo:100,category:'fuel',liters:1}
],assignments:[{id:'a',userId:'self',carId:'car',startedAt:'2026-10-01T00:00:00.000Z'},{id:'b',userId:'someone',carId:'other',startedAt:'2026-10-01T00:00:00.000Z'}]};
const enriched=native.enrich({data});
assert.equal(enriched.monthly.length,1);
assert.equal(enriched.monthly[0].total,123656789);
assert.equal(enriched.periods.length,1);
assert.equal(enriched.periods[0].userId,'self');
assert.deepEqual(await native.dispatch('logout',{}),{loggedOut:true});
await assert.rejects(native.dispatch('read',{}),/Kết nối/);
await assert.rejects(native.dispatch('configure',{primaryEmail:'same@gmail.com',secondaryEmail:'same@gmail.com',primaryToken:'p',secondaryToken:'s'}),/phải khác/);
await native.dispatch('configure',{primaryEmail:'admin@gmail.com',secondaryEmail:'storage@gmail.com',primaryToken:'p',secondaryToken:'s'});
globalThis.fetch=async()=>new Response(JSON.stringify({files:[]}),{headers:{'Content-Type':'application/json'}});
await assert.rejects(native.dispatch('login',{username:'missing',password:'000000'}),/Tên đăng nhập/);
await native.dispatch('logout',{});
console.log('Native engine: shared module bundle, role-scoped reports, large amounts, account pinning and login errors passed.');
// An additional Admin typed on a previously NSD-only device must connect primary,
// rather than failing silently or accepting a partial storage configuration.
const {lock,randomKey}=await import('../web/crypto.mjs');
const adminAccount={model:'two-google-v2',orgId:crypto.randomUUID(),userId:crypto.randomUUID(),username:'admin2',email:'admin2@users.invalid',role:'admin',ownerEmail:'admin@gmail.com',secondaryEmail:'storage@gmail.com',rootId:'root',rootKey:randomKey(),mustChange:true};
const encrypted=await lock(adminAccount,'000000','account',100000);
globalThis.fetch=async(url,options={})=>{
 let body;
 if(url.includes('/drive/v2/files/profile'))body={etag:'1',owners:[{emailAddress:'storage@gmail.com'}],labels:{trashed:false}};
 else if(url.includes('/drive/v3/files/profile?alt=media'))body=encrypted;
 else body={files:options.headers.Authorization==='Bearer s'?[{id:'profile',appProperties:{model:'two-google-v2',username:'admin2',orgId:adminAccount.orgId}}]:[]};
 return new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
};
await native.dispatch('configure',{secondaryEmail:'storage@gmail.com',secondaryToken:'s'});
assert.deepEqual(await native.dispatch('login',{username:'admin2',password:'000000'}),{needsPrimary:true,ownerEmail:'admin@gmail.com'});
await native.dispatch('configure',{primaryEmail:'admin@gmail.com',secondaryEmail:'storage@gmail.com',primaryToken:'p',secondaryToken:'s'});
assert.deepEqual(await native.dispatch('login',{username:'admin2',password:'000000'}),{mustChange:true});
await native.dispatch('logout',{});
console.log('Native additional Admin connection handoff passed.');
