import {test} from 'node:test';import assert from 'node:assert/strict';
import {attachmentStem,attachmentToday,attachmentExtension,uniqueAttachmentName,matchesAttachmentName,expenseCategories} from '../web/attachment-names.mjs';
test('attachment names use plate, display category, compact date and original extension',()=>{
 const stem=attachmentStem({plate:'51A-12345',category:'fuel',date:'2026-10-07'});assert.equal(stem,'_51A-12345_Đổ xăng_20261007');assert.equal(uniqueAttachmentName(stem,'camera.JPG'),'_51A-12345_Đổ xăng_20261007.jpg');
 for(const category of Object.keys(expenseCategories))assert.ok(attachmentStem({plate:'XE',category,date:'2026-10-07'}).includes(expenseCategories[category]));
 assert.equal(attachmentStem({plate:'A/B:*?',category:'ownership',date:'2026-10-07'}),'_A-B---_Giấy chủ quyền_20261007');assert.equal(attachmentExtension('no extension'),'');assert.equal(attachmentExtension('image.jpg.exe'),'.exe');assert.equal(attachmentToday(new Date('2026-10-06T18:00:00Z')),'2026-10-07');
 assert.throws(()=>attachmentStem({plate:'XE',category:'fuel',date:'2026-02-30'}));assert.throws(()=>attachmentStem({plate:'XE',category:'bad',date:'2026-10-07'}));
});
test('duplicate suffix stays before extension and existing suffix remains stable on edits',()=>{
 const stem='_XE_Đổ xăng_20261007',used=new Set(Array.from({length:9},(_,i)=>stem+(i?'_'+(i+1):'')+'.jpg').map(s=>s.toLocaleLowerCase('vi-VN')));assert.equal(uniqueAttachmentName(stem,'a.jpg',used),stem+'_10.jpg');
 assert.equal(uniqueAttachmentName(stem,'a.jpg',new Set(),stem+'_2.jpg'),stem+'_2.jpg');assert.equal(matchesAttachmentName(stem+'_2.jpg',stem,'a.jpg'),true);assert.equal(matchesAttachmentName(stem+'_02.jpg',stem,'a.jpg'),false);assert.equal(matchesAttachmentName(stem+'_2.png',stem,'a.jpg'),false);
});
