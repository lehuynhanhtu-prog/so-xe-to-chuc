const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {cloud}=require('./cloud-fixture.cjs');
function setup(){const s=cloud();s.bootstrap();const admin=s.login();return {s,admin};}
function create(s,admin,username,role='driver'){const r=s.api(admin.token,'createUser',{username,name:username,role,initialPassword:'initial-secret'}),first=s.login(username,'initial-secret');assert.equal(first.mustChange,true);assert.deepEqual(Object.keys(first.data).sort(),['me','organization','revision']);assert.throws(()=>s.api(first.token,'read'),/Đổi mật khẩu/);return s.api(first.token,'changePassword',{currentPassword:'initial-secret',password:username+'-secret'});}
function car(s,a,plate='51A-12345'){const r=s.api(a.token,'saveCar',{plate,name:'Xe thử',odo:100,powerType:'hybrid',attachments:[]});return r.data.cars.find(c=>c.plate===plate);}
function tx(carId,extras={}){return {carId,date:'2026-01-01',category:'fuel',amount:10000,odo:200,attachments:[],...extras};}
test('anonymous JSON bridge only exposes health, login and authenticated API',()=>{
  const s=cloud();s.bootstrap();
  const post=payload=>JSON.parse(s.context.doPost({postData:{contents:JSON.stringify(payload)}}).value);
  const health=post({method:'health'});assert.equal(health.ok,true);assert.equal(health.result.version,'4.8.4-native.1');
  const login=post({method:'login',request:{username:'admin',password:'admin-secret'}});assert.equal(login.ok,true);assert.ok(login.result.token);
  const read=post({method:'api',request:{token:login.result.token,action:'read',args:{}}});assert.equal(read.ok,true);assert.equal(read.result.data.organization.name,'Đội Xe');
  assert.match(post({method:'bootstrap',request:{}}).error,/RPC/);
  assert.equal(post({method:'api',request:{token:'invalid',action:'read'}}).ok,false);
});
test('owner-only bootstrap, credentials, session reset, logout and view-only permissions',()=>{
  const s=cloud();assert.equal(s.context.sxHealth().initialized,false);assert.throws(()=>s.context.sxBootstrap({setupCode:'bad'}),/Mã thiết lập/);s.bootstrap();assert.throws(()=>s.bootstrap(),/đã tồn tại/);assert.throws(()=>s.login('admin','wrong'),/không đúng/);
  const a=s.login(),viewer=create(s,a,'viewer','viewer'),extra=create(s,a,'admin2','admin');assert.equal(extra.data.me.role,'admin');
  for(const action of ['createUser','saveCar','saveTransaction','deleteTransaction','assign','saveHandover','deleteOrganization','export','restoreBackup'])assert.throws(()=>s.api(viewer.token,action,{}),/chỉ xem|Chỉ Admin/);
  const c=car(s,extra);assert.equal(s.api(viewer.token,'read').data.cars[0].id,c.id);
  const r=s.api(a.token,'editUser',{id:extra.data.me.id,version:0,name:'Admin hai',username:'admin_2',newPassword:'reset-secret'});assert.throws(()=>s.api(extra.token,'read'),/thu hồi/);assert.throws(()=>s.login('admin2','admin2-secret'),/không đúng/);assert.equal(s.login('admin_2','reset-secret').mustChange,true);
  const serialized=JSON.stringify(r);for(const secret of ['driveFileId','rootKey','memberKey','legacyCredential','"password"','sessions','ownerEmail'])assert.equal(serialized.includes(secret),false,secret);
  s.api(a.token,'logout');assert.throws(()=>s.api(a.token,'read'),/thu hồi/);assert.equal(s.locked,false);
});
test('NSD own transactions, handover revokes rights immediately, return restores rights and reminders',()=>{
  const {s,admin:a}=setup(),one=create(s,a,'driver1'),two=create(s,a,'driver2'),c=car(s,a);
  s.api(a.token,'assign',{carId:c.id,userId:one.data.me.id});
  const timeline=s.context.load_();timeline.assignmentEvents[0].at=new Date(Date.now()-60000).toISOString();timeline.assignments[0].startedAt=timeline.assignmentEvents[0].at;s.context.save_(timeline);
  s.api(a.token,'saveTransaction',tx(c.id,{category:'insurance',insuranceStart:'2026-01-01',insuranceExpiry:'2026-12-31'}));
  const write=s.api(one.token,'saveTransaction',tx(c.id)),own=write.data.transactions[0];assert.equal(write.data.transactions.length,1);assert.equal(write.data.reminderTransactions.length,1);
  assert.equal(s.api(two.token,'read').data.transactions.length,0);assert.throws(()=>s.api(two.token,'saveTransaction',tx(c.id)),/đang quản lý/);
  const op=crypto.randomUUID(),args={operationId:op,carId:c.id,fromUserId:one.data.me.id,toUserId:two.data.me.id,at:new Date(Date.now()-30000).toISOString(),odo:300,note:'Bàn giao'};
  const after=s.api(one.token,'saveHandover',args);assert.equal(after.data.reminderTransactions.length,0);assert.equal(after.data.transactions[0].id,own.id);assert.equal(after.data.assignments.every(x=>x.userId===one.data.me.id),true);
  assert.equal(s.api(one.token,'saveHandover',args).data.handovers.length,1,'same handover retry is safe after ownership changed');
  assert.throws(()=>s.api(one.token,'saveTransaction',tx(c.id,{id:own.id,version:own.version})),/đang quản lý/);assert.throws(()=>s.api(one.token,'deleteTransaction',{id:own.id,version:own.version}),/đang quản lý/);assert.throws(()=>s.api(one.token,'deleteHandover',{id:after.data.handovers[0].id,version:1}),/đang quản lý/);
  const twoState=s.api(two.token,'read').data;assert.equal(twoState.transactions.length,0);assert.equal(twoState.reminderTransactions.length,1);
  s.api(a.token,'assign',{carId:c.id,userId:one.data.me.id});const returned=s.api(one.token,'saveTransaction',tx(c.id,{id:own.id,version:own.version,amount:20000}));assert.equal(returned.data.transactions[0].amount,20000);assert.equal(returned.data.reminderTransactions.length,1);
  assert.throws(()=>s.api(one.token,'saveTransaction',tx(c.id,{id:own.id,version:own.version})),/thay đổi/);
});
test('NSD entering on behalf keeps edit/delete rights while the vehicle manager has read-only access',()=>{
  const {s,admin:a}=setup(),one=create(s,a,'driver1'),two=create(s,a,'driver2'),ownCar=car(s,a,'51A-11111'),otherCar=car(s,a,'51A-22222');
  s.api(a.token,'assign',{carId:ownCar.id,userId:one.data.me.id});s.api(a.token,'assign',{carId:otherCar.id,userId:two.data.me.id});
  assert.throws(()=>s.api(one.token,'saveTransaction',tx(otherCar.id)),/Nhập hộ|đang do NSD khác/);
  const created=s.api(one.token,'saveTransaction',tx(otherCar.id,{category:'major_maintenance',description:'Bảo dưỡng cấp lớn',repeatKm:20000,onBehalf:true,enteredFor:two.data.me.id})),record=created.data.transactions[0];
  assert.equal(record.enteredBy,one.data.me.id);assert.equal(record.enteredFor,two.data.me.id);assert.equal(record.onBehalf,true);assert.equal(record.repeatKm,20000);
  const managerView=s.api(two.token,'read').data;assert.equal(managerView.transactions.length,1);assert.equal(managerView.transactions[0].id,record.id);assert.throws(()=>s.api(two.token,'saveTransaction',{...record,amount:1}),/mình nhập/);assert.throws(()=>s.api(two.token,'deleteTransaction',{id:record.id,version:record.version}),/mình nhập/);
  s.api(a.token,'assign',{carId:otherCar.id,userId:''});assert.equal(s.api(two.token,'read').data.transactions.length,0);
  const edited=s.api(one.token,'saveTransaction',{...record,amount:25000,attachments:[]}).data.transactions[0];assert.equal(edited.amount,25000);s.api(one.token,'deleteTransaction',{id:edited.id,version:edited.version});assert.equal(s.api(one.token,'read').data.transactions.length,0);
});
test('attachment authorization, retries and before/after commit failures preserve references',()=>{
  const {s,admin:a}=setup(),one=create(s,a,'driver1'),two=create(s,a,'driver2'),c=car(s,a);s.api(a.token,'assign',{carId:c.id,userId:one.data.me.id});
  const input=tx(c.id,{operationId:crypto.randomUUID(),attachments:[{name:'hóa đơn.png',type:'image/png',base64:Buffer.from('ảnh UTF-8').toString('base64')}]});
  const first=s.api(one.token,'saveTransaction',input),t=first.data.transactions[0],f=t.attachments[0];assert.match(f.name,/_51A-12345_Đổ xăng_20260101/);assert.equal(f.driveFileId,undefined);
  const count=s.files.size;assert.equal(s.api(one.token,'saveTransaction',input).data.transactions.length,1);assert.equal(s.files.size,count);
  assert.throws(()=>s.api(one.token,'saveTransaction',{...input,amount:22}),/nội dung khác/);
  const downloaded=s.api(one.token,'attachment',{transactionId:t.id,id:f.id}).file;assert.equal(Buffer.from(downloaded.base64,'base64').toString(),'ảnh UTF-8');assert.throws(()=>s.api(two.token,'attachment',{transactionId:t.id,id:f.id}),/Không có quyền/);
  assert.throws(()=>s.api(one.token,'saveTransaction',tx(c.id,{attachments:[{driveFileId:'external',name:'outside'}]})),/mã tệp/);
  s.failWrite('before');assert.throws(()=>s.api(one.token,'saveTransaction',{...input,operationId:crypto.randomUUID()}),/write before/);assert.equal(s.db().transactions.length,1);assert.equal([...s.files.values()].filter(f=>f.trashed).length,1);
  s.failWrite('after');const recovered=s.api(one.token,'saveTransaction',{...input,operationId:crypto.randomUUID()});assert.equal(recovered.data.transactions.length,2);for(const r of s.db().transactions)assert.equal(s.files.get(r.attachments[0].driveFileId).trashed,false);
  s.api(one.token,'deleteTransaction',{id:t.id,version:t.version});assert.throws(()=>s.api(one.token,'attachment',{transactionId:t.id,id:f.id}),/Không có quyền/);
});
test('encrypted cloud backup restores attachments, versions and credentials and revokes every old session',()=>{
  const {s,admin:a}=setup(),d=create(s,a,'driver1'),c=car(s,a);s.api(a.token,'assign',{carId:c.id,userId:d.data.me.id});s.api(d.token,'saveTransaction',tx(c.id,{attachments:[{name:'a.txt',base64:'YWJj',type:'text/plain'}]}));
  const b=s.api(a.token,'export',{password:'backup-secret'});assert.equal(b.backup.includes('admin-secret'),false);assert.throws(()=>s.api(a.token,'inspectBackup',{backup:b.backup,password:'wrong-secret'}),/sai|hỏng/);
  const old=s.db().transactions[0],oldFile=old.attachments[0].driveFileId;s.api(a.token,'deleteTransaction',{id:old.id,version:old.version});s.files.delete(oldFile);
  const rev=s.db().revision;assert.throws(()=>s.api(a.token,'restoreBackup',{backup:b.backup,password:'backup-secret',confirmation:'Đội Xe',adminPassword:'admin-secret',expectedRevision:rev-1}),/thay đổi/);
  const restored=s.api(a.token,'restoreBackup',{backup:b.backup,password:'backup-secret',confirmation:'Đội Xe',adminPassword:'admin-secret',expectedRevision:rev});assert.equal(restored.restored,true);assert.throws(()=>s.api(a.token,'read'),/thu hồi/);assert.throws(()=>s.api(d.token,'read'),/thu hồi/);
  const fresh=s.login('driver1','driver1-secret'),t=fresh.data.transactions[0];assert.ok(t.version>old.version);assert.equal(s.api(fresh.token,'attachment',{transactionId:t.id,id:t.attachments[0].id}).file.base64,'YWJj');
  const destination=cloud();destination.context.sxBootstrap({setupCode:destination.setup,action:'import',backup:b.backup,password:'backup-secret',confirmation:'Đội Xe'});assert.equal(destination.login().data.cars.length,1);
});
test('full 4.8.3 backup migration retains passwords and history without reading or modifying source Google',async()=>{
  const {MemoryDrive}=await import('./memory-drive.mjs'),{DualDrive}=await import('../web/dual-drive.mjs'),{DualService}=await import('../web/dual-service.mjs');
  const files=new Map(),a=new MemoryDrive('owner@example.test',files),b=new MemoryDrive('member@example.test',files),source=new DualService(new DualDrive(a,b,a.email,b.email));
  await source.createOrganization({organizationName:'Tổ chức cũ',adminName:'Admin',password:'source-secret'});
  await source.api('createUser',{name:'Lái xe',username:'driver1',role:'driver',initialPassword:'initial-secret'});
  await source.api('createUser',{name:'Admin bổ sung',username:'admin2',role:'admin',initialPassword:'initial-secret'});
  await source.api('saveCar',{plate:'OLD-01',name:'Xe cũ',odo:123,powerType:'electric',attachments:[{name:'giấy.txt',base64:'YWJj',type:'text/plain'}]});
  const db=(await source.root()).value;await source.api('assign',{carId:db.cars[0].id,userId:db.users.find(u=>u.username==='driver1').id});
  const exported=await source.api('export',{password:'backup-secret'}),before=JSON.stringify([...files]);
  const s=cloud(),args={setupCode:s.setup,backup:exported.backup,password:'backup-secret'};
  const inspected=s.context.sxBootstrap({...args,action:'inspectImport'});assert.equal(inspected.summary.users,3);assert.equal(s.folders.size,0,'inspection has no writes');
  assert.throws(()=>s.context.sxBootstrap({...args,action:'import',confirmation:'wrong'}),/tên tổ chức/);
  s.context.sxBootstrap({...args,action:'import',confirmation:'Tổ chức cũ'});
  const admin=s.login('admin','source-secret');assert.equal(admin.data.cars[0].powerType,'electric');assert.equal(s.login('driver1','initial-secret').mustChange,true);assert.equal(s.login('admin2','initial-secret').mustChange,true);
  assert.equal(s.db().users.find(u=>u.username==='admin').legacyCredential,undefined,'first successful login upgrades password');
  const c=admin.data.cars[0];assert.equal(s.api(admin.token,'attachment',{carId:c.id,id:c.attachments[0].id}).file.base64,'YWJj');assert.equal(JSON.stringify([...files]),before);
});
