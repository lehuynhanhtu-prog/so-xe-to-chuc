const clientId='862228353042-bboej03g9j2nnhvmcp9n4uhlp97opdoj.apps.googleusercontent.com';
const params=new URLSearchParams(location.search),state=params.get('state')||'',port=Number(params.get('port')),status=document.querySelector('#status'),connect=document.querySelector('#connect');
function fail(error){status.className='error';status.textContent=error instanceof Error?error.message:String(error);connect.disabled=false;connect.textContent='Thử lại';}
function appUrl(values){const query=new URLSearchParams({state,...values});return 'http://127.0.0.1:'+port+'/google-auth?'+query;}
async function connected(result){
  if(result.error)throw new Error(result.error_description||result.error);
  const response=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+result.access_token},cache:'no-store'});
  if(!response.ok)throw new Error('Không xác minh được tài khoản Google.');
  const profile=await response.json();if(!profile.email||profile.email_verified===false)throw new Error('Email Google chưa được xác minh.');
  status.className='';status.textContent='Đã kết nối '+profile.email+'. Đang trả kết quả an toàn về ứng dụng…';connect.hidden=true;location.replace(appUrl({access_token:result.access_token,email:profile.email}));
}
function initialize(){
  if(!/^[0-9a-f-]{60,}$/i.test(state)||!Number.isInteger(port)||port<1024||port>65535){fail('Phiên kết nối không hợp lệ. Hãy quay lại ứng dụng và thử lại.');return;}
  if(!globalThis.google?.accounts?.oauth2){setTimeout(initialize,250);return;}
  const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',include_granted_scopes:false,callback:result=>connected(result).catch(fail),error_callback:()=>fail('Cửa sổ Google đã bị đóng hoặc bị chặn.')});
  connect.disabled=false;connect.textContent='Chọn tài khoản Google';connect.onclick=()=>{connect.disabled=true;status.textContent='Đang chờ Google…';client.requestAccessToken({prompt:'select_account'});};
}
initialize();
