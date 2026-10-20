// HTML-service RPC: all Drive access and authorization stay on Apps Script.
export function rpc(method,request={}){
  return new Promise((resolve,reject)=>{
    if(!globalThis.google?.script?.run)return reject(new Error('Mở ứng dụng bằng URL Apps Script đã triển khai.'));
    const call=google.script.run.withSuccessHandler(resolve).withFailureHandler(error=>reject(new Error(error?.message||'Không kết nối được dịch vụ.')));
    if(method==='health')call.sxHealth();
    else if(method==='login')call.sxLogin(request);
    else if(method==='bootstrap')call.sxBootstrap(request);
    else if(method==='api')call.sxApi(request);
    else reject(new Error('RPC không hợp lệ.'));
  });
}
export class CloudService{
  constructor(){this.token='';this.account=null;this.tail=Promise.resolve();}
  accept(r){if(r.token)this.token=r.token;if(r.data)this.account=r.data.me;return r;}
  async login(username,password){return this.accept(await rpc('login',{username,password}));}
  api(action,args={}){const work=()=>rpc('api',{token:this.token,action,args}).then(r=>this.accept(r));const pending=this.tail.then(work,work);this.tail=pending.catch(()=>{});return pending;}
  logout(){const token=this.token;this.token='';this.account=null;return rpc('api',{token,action:'logout'});}
}
