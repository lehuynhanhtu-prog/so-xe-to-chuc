import {Drive} from './core/drive.mjs';
import {DualDrive} from './core/dual-drive.mjs';
import {DualService} from './core/dual-service.mjs';
import {vehicleReminders} from './core/reminders.mjs';
import {monthlySummary} from './core/reports.mjs';
import {managementPeriods,durationText} from './core/handovers.mjs';
export const categories={fuel:'Tiền xăng',charge:'Sạc xe',battery_rental:'Thuê pin',maintenance:'Bảo dưỡng',parts:'Phụ tùng',insurance:'Bảo hiểm TNDS',inspection:'Đăng kiểm',road_fee:'Phí đường bộ',other:'Khác'};
let service,primary,secondary,identity='';
export function enrich(result){if(result?.data){const state=result.data;return {...result,reminders:vehicleReminders(state,new Date().toLocaleDateString('sv-SE')),monthly:monthlySummary(state,{},categories),periods:managementPeriods(state).map(p=>({...p,duration:durationText(p.milliseconds)}))};}return result;}
export async function dispatch(action,args){
 if(action==='configure'){
  const key=JSON.stringify([args.primaryEmail||'',args.secondaryEmail]);
  if(identity!==key||!service){primary=args.primaryToken?new Drive(args.primaryToken):null;secondary=new Drive(args.secondaryToken);service=new DualService(new DualDrive(primary,secondary,args.primaryEmail||'',args.secondaryEmail));identity=key;}
  else{if(primary)primary.token=args.primaryToken;secondary.token=args.secondaryToken;}
  return {configured:true};
 }
 if(action==='logout'){service=null;identity='';return {loggedOut:true};}
 if(!service)throw new Error('Kết nối tài khoản Google trước.');
 if(action==='login')return enrich(await service.loginNamed(args.username,args.password));
 if(action==='createOrganization')return enrich(await service.createOrganization(args));
 return enrich(await service.api(action,args));
}
let tail=Promise.resolve();
if(globalThis.Native){globalThis.nativeCall=(id,action,args)=>{tail=tail.then(async()=>{try{Native.reply(id,JSON.stringify({ok:true,result:await dispatch(action,args)}));}catch(e){Native.reply(id,JSON.stringify({ok:false,error:e.message,status:e.status||0}));}});};Native.ready();}
