import {Drive} from './core/drive.mjs';
import {DualDrive} from './core/dual-drive.mjs';
import {DualService} from './core/dual-service.mjs';
import {vehicleReminders} from './core/reminders.mjs';
import {monthlySummary,transactionsExcel,reportsExcel,excelDocument} from './core/reports.mjs';
import {displayDate} from './core/dates.mjs';
import {managementPeriods,durationText} from './core/handovers.mjs';
// Older supported System WebViews retain the same JSON-ledger semantics.
globalThis.structuredClone ??= function clone(value){
 if(value===null||typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(clone);
 if(value instanceof Uint8Array)return value.slice();
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clone(v)]));
};
crypto.randomUUID ??= function(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
};
String.prototype.replaceAll ??= function(search,replacement){return this.split(search).join(replacement);};
export const categories={fuel:'Tiền xăng',charge:'Sạc xe',battery_rental:'Thuê pin',maintenance:'Bảo dưỡng',parts:'Phụ tùng',insurance:'Bảo hiểm TNDS',inspection:'Đăng kiểm',road_fee:'Phí đường bộ',other:'Khác'};
const bytesFromBase64=value=>{const binary=atob(value||''),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;};
async function nativeFetch(url,options={}){
 const method=(options.method||'GET').toUpperCase();
 if(method==='GET'&&globalThis.Native?.httpGet){
  const headers=new Headers(options.headers||{}),result=JSON.parse(Native.httpGet(String(url),headers.get('Authorization')||''));
  if(!result.status)throw new Error(result.error||'Không kết nối được Google Drive.');
  return new Response(bytesFromBase64(result.body),{status:result.status,headers:{'Content-Type':result.contentType||'application/octet-stream',...(result.etag?{ETag:result.etag}:{})}});
 }
 return globalThis.fetch(url,options);
}
let service,primary,secondary,identity='';
export function enrich(result){if(result?.data){const state=result.data;return {...result,reminders:vehicleReminders(state,new Date().toLocaleDateString('sv-SE')),monthly:monthlySummary(state,{},categories),periods:managementPeriods(state).map(p=>({...p,duration:durationText(p.milliseconds)}))};}return result;}
export function exportExcel(state,kind,filters={}){
 if(filters.from&&filters.to&&filters.from>filters.to)throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
 if(kind==='transactions')return transactionsExcel(state,filters,categories);
 if(kind==='monthly')return reportsExcel(state,filters,categories);
 if(kind!=='management')throw new Error('Loại báo cáo không hợp lệ.');
 const who=id=>state.users.find(u=>u.id===id)?.name||'—',car=id=>state.carChoices.find(c=>c.id===id)?.plate||'—';
 return excelDocument('Thời gian quản lý',['Người quản lý/lái xe','Biển số','Từ ngày','Đến ngày','Thời gian','Trạng thái'],managementPeriods(state,filters).map(p=>[who(p.userId),car(p.carId),displayDate(p.from.slice(0,10))+' '+p.from.slice(11,16)+' UTC',displayDate(p.to.slice(0,10))+' '+p.to.slice(11,16)+' UTC',durationText(p.milliseconds),p.ongoing?'Đang quản lý':'Đã kết thúc']));
}
export async function dispatch(action,args){
 if(action==='configure'){
  const key=JSON.stringify([args.primaryEmail||'',args.secondaryEmail]);
  if(identity!==key||!service){primary=args.primaryToken?new Drive(args.primaryToken,nativeFetch):null;secondary=new Drive(args.secondaryToken,nativeFetch);service=new DualService(new DualDrive(primary,secondary,args.primaryEmail||'',args.secondaryEmail));identity=key;}
  else{if(primary)primary.token=args.primaryToken;secondary.token=args.secondaryToken;}
  return {configured:true};
 }
 if(action==='logout'){service=null;identity='';return {loggedOut:true};}
 if(!service)throw new Error('Kết nối tài khoản Google trước.');
 if(action==='inspectTransfer')return service.inspectTransfer(args);
 if(action==='transferStorage')return service.transferStorage(args);
 if(action==='login'){
  const selected=await service.resolveNamed(args.username,args.password,'',args.adminMode?'admin':'');
  if(selected.account.role==='admin'&&!primary)return {needsPrimary:true,ownerEmail:selected.account.ownerEmail};
  return enrich(await service.login(selected.profileId,args.password));
 }
 if(action==='exportExcel'){const result=await service.api('read',{});return {document:exportExcel(result.data,args.kind,args.filters||{})};}
 if(action==='createOrganization')return enrich(await service.createOrganization(args));
 return enrich(await service.api(action,args));
}
let tail=Promise.resolve();
if(globalThis.Native){globalThis.nativeCall=(id,action,args)=>{tail=tail.then(async()=>{try{Native.reply(id,JSON.stringify({ok:true,result:await dispatch(action,args)}));}catch(e){Native.reply(id,JSON.stringify({ok:false,error:e.message,status:e.status||0}));}});};Native.ready();}
