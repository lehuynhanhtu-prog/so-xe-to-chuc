(() => {
  'use strict';
  const PROFILE_KEY='so-xe-org-device-profile-v1',INVITE_KEY='so-xe-org-pending-invite-v1';
  let profile=read(PROFILE_KEY),pendingInvite=read(INVITE_KEY);
  const $=s=>document.querySelector(s), id=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random();
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
  async function hash(value){const bytes=new TextEncoder().encode(value);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function org(){return data.organization||null}
  function users(){return org()?.users||[]}
  function currentUser(){return users().find(x=>x.id===profile?.userId)||null}
  function isAdmin(){return currentUser()?.role==='admin'&&currentUser()?.status==='approved'}
  function downloadJson(value,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function ensureOrganization(){if(!data.organization)data.organization={id:id(),name:'',driveFolderId:'',users:[],invites:[],assignments:[],handovers:[],createdAt:new Date().toISOString()};return data.organization}
  function showGate(){
    const gate=$('#orgGate');gate.hidden=false;document.body.classList.add('org-locked');
    const known=profile?.displayName;
    $('#orgKnownDevice').hidden=!known;
    if(known)$('#orgKnownName').textContent=known;
  }
  function unlock(){
    const user=currentUser();
    if(!user||user.status!=='approved'){showGate();$('#orgGateMessage').textContent=user?'Tài khoản đang chờ Admin duyệt. Hãy đồng bộ lại sau khi được duyệt.':'';return}
    $('#orgGate').hidden=true;document.body.classList.remove('org-locked');
    $('#orgIdentity').textContent=`${org()?.name||'Tổ chức'} · ${user.name} · ${user.role==='admin'?'Admin':'Người quản lý/lái xe'}`;
    applyRole();refreshOrganization();
  }
  function applyRole(){
    const admin=isAdmin();
    document.querySelectorAll('[data-admin-only]').forEach(e=>e.hidden=!admin);
    document.querySelectorAll('#addCar,#addCarTop').forEach(e=>e.hidden=!admin);
    document.querySelectorAll('.car .actions').forEach(e=>{if(!admin)e.hidden=true});
  }
  function memberOptions(selected=''){return users().filter(x=>x.status==='approved').map(x=>`<option value="${x.id}" ${x.id===selected?'selected':''}>${esc(x.name)}${x.role==='admin'?' · Admin':''}</option>`).join('')}
  function assignedUser(carId){const a=(org()?.assignments||[]).filter(x=>x.carId===carId&&!x.endedAt).sort((a,b)=>b.startedAt.localeCompare(a.startedAt))[0];return a?users().find(x=>x.id===a.userId):null}
  function fillExpenseMembers(){
    const select=$('#expenseEnteredFor');if(!select)return;
    const me=currentUser(),selected=select.value||me?.id||'';select.innerHTML=memberOptions(selected);select.value=selected;
    updateOnBehalf();
  }
  function updateOnBehalf(){
    const carId=$('#expenseCar')?.value,userId=$('#expenseEnteredFor')?.value,assigned=assignedUser(carId),me=currentUser();
    const behalf=Boolean(userId&&me&&userId!==me.id)||Boolean(assigned&&me&&assigned.id!==me.id);
    $('#expenseOnBehalf').checked=behalf;
    $('#expenseOnBehalfHint').textContent=assigned?`Người đang quản lý xe: ${assigned.name}`:'Xe chưa được phân công';
  }
  function refreshOrganization(){
    const o=org();if(!o)return;
    $('#organizationName').textContent=o.name||'Tổ chức';
    const memberRows=users().map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email||'')}</td><td>${u.role==='admin'?'Admin':'Người quản lý/lái xe'}</td><td><span class="tag ${u.status==='approved'?'charge':'maint'}">${u.status==='approved'?'Đã duyệt':'Chờ duyệt'}</span></td><td>${isAdmin()&&u.status!=='approved'?`<button class="btn" onclick="approveOrgUser('${u.id}')">Duyệt</button>`:''}</td></tr>`).join('');
    $('#orgMemberRows').innerHTML=memberRows||'<tr><td colspan="5">Chưa có thành viên</td></tr>';
    $('#assignmentCar').innerHTML=data.cars.map(c=>`<option value="${c.id}">${esc(c.plate)} · ${esc(c.name||'Xe')}</option>`).join('');
    $('#assignmentUser').innerHTML=memberOptions();
    const assignmentRows=data.cars.map(c=>{const u=assignedUser(c.id);return `<tr><td>${esc(c.plate)}</td><td>${esc(u?.name||'Chưa phân công')}</td><td>${u?dateVN((org().assignments.find(x=>x.carId===c.id&&x.userId===u.id&&!x.endedAt)||{}).startedAt?.slice(0,10)):''}</td></tr>`}).join('');
    $('#orgAssignmentRows').innerHTML=assignmentRows||'<tr><td colspan="3">Chưa có xe</td></tr>';
    $('#handoverCar').innerHTML=$('#assignmentCar').innerHTML;$('#handoverTo').innerHTML=memberOptions();
    $('#orgHandoverRows').innerHTML=(o.handovers||[]).slice().reverse().map(h=>{const c=car(h.carId),from=users().find(x=>x.id===h.fromUserId),to=users().find(x=>x.id===h.toUserId);return `<tr><td>${dateVN(h.date)}</td><td>${esc(c?.plate||'')}</td><td>${esc(from?.name||'Chưa phân công')}</td><td>${esc(to?.name||'')}</td><td>${Number(h.odo||0).toLocaleString('vi-VN')} km</td><td>${esc(h.note||'')}</td></tr>`}).join('')||'<tr><td colspan="6">Chưa có bàn giao</td></tr>';
    fillExpenseMembers();applyRole();
  }
  window.orgCurrentUser=()=>currentUser();window.orgAssignedUser=assignedUser;window.orgRefresh=()=>{if(currentUser()?.status==='approved')unlock();else showGate()};
  window.approveOrgUser=userId=>{if(!isAdmin())return;const u=users().find(x=>x.id===userId);if(!u)return;u.status='approved';u.approvedAt=new Date().toISOString();u.approvedBy=currentUser().id;persist();refreshOrganization();autoSyncNow();toast('Đã duyệt thành viên')};
  $('#orgAdminForm').onsubmit=async e=>{e.preventDefault();const name=$('#orgAdminName').value.trim(),organizationName=$('#orgAdminOrganization').value.trim(),password=$('#orgAdminPassword').value;if(!name||!organizationName||password.length<6)return;const o=ensureOrganization(),user={id:id(),name,email:$('#orgAdminEmail').value.trim(),role:'admin',status:'approved',passwordHash:await hash(password),createdAt:new Date().toISOString()};o.name=organizationName;o.users=[user];profile={orgId:o.id,userId:user.id,displayName:user.name};write(PROFILE_KEY,profile);persist();unlock();autoSyncNow()};
  $('#orgInviteFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const invite=JSON.parse(await file.text());if(invite.format!=='so-xe-org-invite'||!invite.orgId||!invite.inviteToken)throw new Error();pendingInvite=invite;write(INVITE_KEY,invite);$('#orgJoinFields').hidden=false;$('#orgJoinOrganization').textContent=invite.organizationName;$('#orgJoinName').value=invite.suggestedName||'';$('#orgJoinEmail').value=invite.email||''}catch{alert('File mời tổ chức không hợp lệ')}};
  $('#orgJoinForm').onsubmit=async e=>{e.preventDefault();if(!pendingInvite)return;const name=$('#orgJoinName').value.trim(),password=$('#orgJoinPassword').value;if(!name||password.length<6)return;const o=ensureOrganization();o.id=pendingInvite.orgId;o.name=pendingInvite.organizationName;o.driveFolderId=pendingInvite.driveFolderId||'';if(o.driveFolderId)localStorage.setItem('so-xe-org-folder-id',o.driveFolderId);const user={id:id(),name,email:$('#orgJoinEmail').value.trim(),role:'driver',status:'pending',inviteToken:pendingInvite.inviteToken,passwordHash:await hash(password),createdAt:new Date().toISOString()};o.users.push(user);profile={orgId:o.id,userId:user.id,displayName:user.name};write(PROFILE_KEY,profile);persist();$('#orgGateMessage').textContent='Đã đăng ký. Hãy kết nối Google Drive và chờ Admin duyệt.';autoSyncNow()};
  $('#orgContinue').onclick=()=>unlock();$('#orgSwitchAccount').onclick=()=>{localStorage.removeItem(PROFILE_KEY);profile=null;location.reload()};
  $('#createOrgInvite').onclick=async()=>{if(!isAdmin())return;const email=$('#inviteEmail').value.trim(),name=$('#inviteName').value.trim(),o=org(),tokenValue=id();if(!email){alert('Hãy nhập email Google của người được mời.');return}if(typeof token==='undefined'||!token){alert('Hãy kết nối Google Drive trước khi tạo file mời.');return}try{const folderId=await ensureOrganizationDriveFolder(),share=await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}/permissions?sendNotificationEmail=true`,{method:'POST',headers:driveHeaders(),body:JSON.stringify({type:'user',role:'writer',emailAddress:email})});if(!share.ok&&share.status!==409)throw new Error('Không chia sẻ được thư mục Drive cho email này.');const invite={id:id(),token:tokenValue,email,name,status:'issued',createdAt:new Date().toISOString(),createdBy:currentUser().id};o.invites.push(invite);o.driveFolderId=folderId;persist();const payload={format:'so-xe-org-invite',version:1,orgId:o.id,organizationName:o.name,driveFolderId:folderId,inviteToken:tokenValue,email,suggestedName:name,issuedAt:invite.createdAt};downloadJson(payload,`loi-moi-${o.name.replace(/[^a-zA-Z0-9]+/g,'-')}.json`);autoSyncNow();toast('Đã chia sẻ Drive và tạo file mời')}catch(error){toast(error.message||'Không tạo được file mời')}};
  $('#assignVehicle').onclick=()=>{if(!isAdmin())return;const carId=$('#assignmentCar').value,userId=$('#assignmentUser').value;if(!carId||!userId)return;const now=new Date().toISOString();(org().assignments||[]).filter(x=>x.carId===carId&&!x.endedAt).forEach(x=>x.endedAt=now);org().assignments.push({id:id(),carId,userId,startedAt:now,assignedBy:currentUser().id});persist();refreshOrganization();autoSyncNow();toast('Đã phân công xe')};
  $('#saveHandover').onclick=()=>{if(!isAdmin())return;const carId=$('#handoverCar').value,toUserId=$('#handoverTo').value,c=car(carId),from=assignedUser(carId),date=parseDateInput($('#handoverDate').value);if(!date||!carId||!toUserId)return alert('Hãy nhập đủ thông tin bàn giao.');const odo=Number($('#handoverOdo').value)||Number(c?.odo)||0,now=new Date().toISOString();(org().assignments||[]).filter(x=>x.carId===carId&&!x.endedAt).forEach(x=>x.endedAt=now);org().assignments.push({id:id(),carId,userId:toUserId,startedAt:now,assignedBy:currentUser().id});org().handovers.push({id:id(),carId,fromUserId:from?.id||'',toUserId,date,odo,note:$('#handoverNote').value.trim(),createdAt:now,createdBy:currentUser().id});if(c)c.odo=Math.max(Number(c.odo)||0,odo);persist();refreshOrganization();render();autoSyncNow();toast('Đã lưu bàn giao xe')};
  $('#expenseEnteredFor')?.addEventListener('change',updateOnBehalf);$('#expenseCar')?.addEventListener('change',updateOnBehalf);
  const originalRender=window.render; // render is lexical; mutation refresh is handled after common actions.
  document.addEventListener('click',()=>setTimeout(()=>{if(!document.body.classList.contains('org-locked'))refreshOrganization()},0));
  if(profile&&currentUser()?.status==='approved')unlock();else showGate();
  setInterval(()=>{if(!profile)return;const user=currentUser();if(user?.status==='approved'&&document.body.classList.contains('org-locked'))unlock()},1500);
})();
