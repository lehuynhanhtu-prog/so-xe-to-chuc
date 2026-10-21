import {build} from 'esbuild';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const data={organization:{name:'Đội Xe'},me:{id:'self',role:'driver'},cars:[{id:'car',plate:'51A',odo:1000}],users:[{id:'self',name:'SELF'},{id:'someone',name:'OTHER_PERSON'}],carChoices:[{id:'car',plate:'51A',assignedUserId:'self'},{id:'other',plate:'OTHER',assignedUserId:'someone'}],transactions:[
 {id:'own',carId:'car',enteredBy:'self',date:'2026-10-01',updatedAt:'2026-10-01',amount:123456789,odo:1000,category:'fuel',liters:10},
 {id:'visible',carId:'car',enteredBy:'someone',date:'2026-10-02',updatedAt:'2026-10-02',amount:200000,odo:1100,category:'fuel',liters:5},
 {id:'forbidden',carId:'other',enteredBy:'someone',date:'2026-10-01',updatedAt:'2026-10-01',amount:99999,odo:100,category:'fuel',liters:1}
],assignments:[{id:'a',userId:'self',carId:'car',startedAt:'2026-10-01T00:00:00.000Z'},{id:'b',userId:'someone',carId:'other',startedAt:'2026-10-01T00:00:00.000Z'}]};

let calls=[];
globalThis.Native={
 ready(){},reply(){},
 httpPost(json){
  const request=JSON.parse(json);calls.push(request);
  if(request.method==='login')return JSON.stringify({ok:true,result:{token:'session-token',data}});
  if(request.method==='health')return JSON.stringify({ok:true,result:{version:'4.8.4-native.1'}});
  if(request.method==='api'&&request.request.token==='session-token'&&request.request.action==='read')return JSON.stringify({ok:true,result:{data}});
  if(request.method==='api'&&request.request.action==='logout')return JSON.stringify({ok:true,result:{loggedOut:true}});
  return JSON.stringify({ok:false,error:'Từ chối'});
 }
};

const bundle=await build({entryPoints:['android/app/src/main/assets/native-engine.mjs'],bundle:true,format:'esm',write:false,plugins:[{name:'shared-core',setup(b){b.onResolve({filter:/^\.\/core\//},a=>({path:resolve('web',a.path.slice(7))}));}}]});
const native=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));

const xml=native.exportExcel(data,'transactions',{});
assert.ok(xml.includes('123456789'));assert.ok(xml.includes('ODO (km)'));assert.ok(!xml.includes('99999'));
assert.ok(!native.exportExcel(data,'management',{}).includes('OTHER_PERSON'));
assert.ok(!native.exportExcel(data,'transactions',{from:'2026-10-02'}).includes('123456789'));
assert.throws(()=>native.exportExcel(data,'monthly',{from:'2026-10-02',to:'2026-10-01'}),/Ngày bắt đầu/);

const enriched=native.enrich({data});
assert.equal(enriched.monthly.length,1);assert.equal(enriched.monthly[0].total,123456789);
assert.equal(enriched.periods.length,1);assert.equal(enriched.periods[0].userId,'self');

assert.equal((await native.dispatch('health',{})).version,'4.8.4-native.1');
const login=await native.dispatch('login',{username:'driver1',password:'secret'});assert.equal(login.data.organization.name,'Đội Xe');
assert.equal((await native.dispatch('read',{})).data.me.id,'self');
assert.equal((await native.dispatch('exportExcel',{kind:'transactions',filters:{}})).document.includes('123456789'),true);
assert.deepEqual(await native.dispatch('logout',{}),{loggedOut:true});
await assert.rejects(native.dispatch('read',{}),/Phiên đăng nhập/);
assert.equal(calls.some(x=>x.method==='login'&&x.request.password==='secret'),true);
assert.equal(calls.filter(x=>x.method==='api').every(x=>x.request.token==='session-token'),true);

console.log('Native engine: Apps Script RPC, session handling, reports, reminders and role-scoped exports passed.');
