import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),{cloud}=require('./cloud-fixture.cjs');
test('self-contained Apps Script UI: no Google login, create user, forced password change, mobile role controls and backup',async()=>{
  const s=cloud(),html=await readFile('apps-script-cloud/Index.html','utf8');s.bootstrap();const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-gpu']});
  const errors=[];
  try{
    async function pageFor(mobile=false){const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900}}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.exposeFunction('serverRpc',(method,a)=>JSON.parse(JSON.stringify(s.context[method](a))));await page.addInitScript(()=>{window.google={script:{get run(){let success,failure;const runner={withSuccessHandler(fn){success=fn;return runner;},withFailureHandler(fn){failure=fn;return runner;}};for(const method of ['sxHealth','sxLogin','sxBootstrap','sxApi'])runner[method]=a=>window.serverRpc(method,a).then(v=>success(v)).catch(e=>failure({message:e.message}));return runner;}}};});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForSelector('#open');return page;}
    async function login(page,user,password){await page.locator('#open [name=username]').fill(user);await page.locator('#open [name=password]').fill(password);await page.locator('#open button[type=submit]').click();}
    const a=await pageFor();assert.equal(await a.locator('#googleLogin,#memberLogin,#chooseAdmin').count(),0);await login(a,'admin','admin-secret');await a.waitForSelector('#app:not([hidden])');
    await a.locator('[data-tab=members]').click();await a.locator('#addUser').click();await a.locator('#modal [name=name]').fill('Lái xe thử');await a.locator('#modal [name=username]').fill('driver1');await a.locator('#modal [name=initialPassword]').fill('initial-secret');await a.locator('#modalSubmit').click();await a.waitForSelector('#modal:not([open])',{state:'attached'});assert.match(await a.locator('#content').innerText(),/Lái xe thử/);
    await a.locator('[data-tab=cars]').click();await a.locator('#addCar').click();await a.locator('#modal [name=plate]').fill('51A-12345');await a.locator('#modal [name=name]').fill('Xe thử');await a.locator('#modalSubmit').click();await a.waitForSelector('#modal:not([open])',{state:'attached'});
    const car=s.db().cars[0],driver=s.db().users.find(u=>u.username==='driver1'),admin=s.login();s.api(admin.token,'assign',{carId:car.id,userId:driver.id});
    const d=await pageFor(true);await login(d,'driver1','initial-secret');await d.waitForSelector('#firstPassword');assert.equal(await d.locator('#app').isVisible(),false);await d.locator('#firstPassword [name=current]').fill('initial-secret');await d.locator('#firstPassword [name=password]').fill('driver-secret');await d.locator('#firstPassword [name=confirm]').fill('driver-secret');await d.locator('#firstPassword button:not([type=button])').click();await d.waitForSelector('#app:not([hidden])');
    assert.equal(await d.locator('[data-tab=members],[data-tab=settings]').count(),0);await d.locator('[data-tab=transactions]').click();await d.locator('#addTransaction').click();await d.locator('#modal [name=amount]').fill('125.000');await d.locator('#modalSubmit').click();await d.waitForSelector('#modal:not([open])',{state:'attached'});assert.match(await d.locator('#content').innerText(),/125.000/);assert.equal(s.db().transactions[0].amount,125000);if(process.env.SOXE_CAPTURE_UI)await d.screenshot({path:'/tmp/soxe-cloud-mobile.png',fullPage:true});
    assert.deepEqual(await d.evaluate(()=>Object.keys(sessionStorage).filter(k=>/token|password|google-session/.test(k))),[]);
    await d.locator('#accountMenu').click();await d.locator('#logout').click();await d.waitForSelector('#open');assert.equal(await d.locator('#open [name=password]').inputValue(),'');
    await a.locator('[data-tab=settings]').click();assert.equal(await a.locator('#reconnect,#reconnectSecondary,#transferStorage').count(),0);await a.locator('#exportButton').click();await a.locator('#modal [name=password]').fill('backup-secret');await a.locator('#modal [name=confirmPassword]').fill('backup-secret');const downloaded=a.waitForEvent('download');await a.locator('#modalSubmit').click();const file=await downloaded;assert.match(file.suggestedFilename(),/\.zip$/);assert.ok((await readFile(await file.path())).length>100);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(r=>server.close(r));}
});
