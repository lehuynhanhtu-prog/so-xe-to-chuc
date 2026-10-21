import {vehicleReminders} from './core/reminders.mjs';
import {monthlySummary,transactionsExcel,reportsExcel,excelDocument} from './core/reports.mjs';
import {displayDate} from './core/dates.mjs';
import {managementPeriods,durationText} from './core/handovers.mjs';

// Native Android Views own the UI. This bundled module only provides the
// shared report/reminder calculations and the narrow Apps Script RPC bridge.
globalThis.structuredClone ??= function clone(value){
 if(value===null||typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(clone);
 if(value instanceof Uint8Array)return value.slice();
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clone(v)]));
};
String.prototype.replaceAll ??= function(search,replacement){return this.split(search).join(replacement);};

export const categories={fuel:'Tiền xăng',charge:'Sạc xe',battery_rental:'Thuê pin',maintenance:'Bảo dưỡng',parts:'Phụ tùng',insurance:'Bảo hiểm TNDS',inspection:'Đăng kiểm',road_fee:'Phí đường bộ',other:'Khác'};
let token='';

function rpc(method,request={}){
 if(!globalThis.Native?.httpPost)throw new Error('Bộ kết nối Apps Script chưa sẵn sàng.');
 const envelope=JSON.parse(Native.httpPost(JSON.stringify({method,request})));
 if(!envelope.ok)throw new Error(envelope.error||'Không kết nối được dịch vụ.');
 return envelope.result||{};
}

export function enrich(result){
 if(result?.token)token=result.token;
 if(result?.data){
  const state=result.data;
  return {...result,reminders:vehicleReminders(state,new Date().toLocaleDateString('sv-SE')),monthly:monthlySummary(state,{},categories),periods:managementPeriods(state).map(p=>({...p,duration:durationText(p.milliseconds)}))};
 }
 return result;
}

export function exportExcel(state,kind,filters={}){
 if(filters.from&&filters.to&&filters.from>filters.to)throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
 if(kind==='transactions')return transactionsExcel(state,filters,categories);
 if(kind==='monthly')return reportsExcel(state,filters,categories);
 if(kind!=='management')throw new Error('Loại báo cáo không hợp lệ.');
 const who=id=>state.users.find(u=>u.id===id)?.name||'—',car=id=>state.carChoices.find(c=>c.id===id)?.plate||'—';
 return excelDocument('Thời gian quản lý',['Người quản lý/lái xe','Biển số','Từ ngày','Đến ngày','Thời gian','Trạng thái'],managementPeriods(state,filters).map(p=>[who(p.userId),car(p.carId),displayDate(p.from.slice(0,10))+' '+p.from.slice(11,16)+' UTC',displayDate(p.to.slice(0,10))+' '+p.to.slice(11,16)+' UTC',durationText(p.milliseconds),p.ongoing?'Đang quản lý':'Đã kết thúc']));
}

export async function dispatch(action,args={}){
 if(action==='health')return rpc('health');
 if(action==='login')return enrich(rpc('login',{username:args.username,password:args.password}));
 if(action==='logout'){
  const current=token;token='';
  if(!current)return {loggedOut:true};
  try{return rpc('api',{token:current,action:'logout',args:{}});}catch{return {loggedOut:true};}
 }
 if(!token)throw new Error('Phiên đăng nhập chưa có hoặc đã hết hạn. Đăng nhập lại.');
 if(action==='exportExcel'){
  const result=enrich(rpc('api',{token,action:'read',args:{}}));
  return {document:exportExcel(result.data,args.kind,args.filters||{})};
 }
 return enrich(rpc('api',{token,action,args}));
}

let tail=Promise.resolve();
if(globalThis.Native){
 globalThis.nativeCall=(id,action,args)=>{tail=tail.then(async()=>{try{Native.reply(id,JSON.stringify({ok:true,result:await dispatch(action,args)}));}catch(e){Native.reply(id,JSON.stringify({ok:false,error:e.message,status:e.status||0}));}});};
 Native.ready();
}
