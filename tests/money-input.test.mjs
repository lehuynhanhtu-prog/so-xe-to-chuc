import {test} from 'node:test';import assert from 'node:assert/strict';import {moneyInputNumber,moneyInputValue,moneyFieldNumber} from '../web/money-input.mjs';
test('Vietnamese currency grouping round trips without changing saved amounts',()=>{for(const n of [0,1,999,1000,1234567,1000000000000])assert.equal(moneyInputNumber(moneyInputValue(n)),n);assert.equal(moneyInputValue(1234567),'1.234.567');assert.equal(moneyInputNumber(' 2.000.000 '),2000000);});
test('unit prices retain decimal values and reject malformed amounts',()=>{assert.equal(moneyInputValue(123456.7,2),'123.456,7');assert.equal(moneyInputNumber('25.000,05'),25000.05);assert.equal(moneyInputNumber('31250.5'),31250.5);for(const s of ['abc','1,2,3','1.2.3'])assert.ok(Number.isNaN(moneyInputNumber(s)));assert.equal(moneyInputNumber('-1.000'),-1000);});

test('editable currency treats incomplete dot groups as thousands',()=>{
 for(const [s,n] of [['1.2345',12345],['12.3456',123456],['123.4567',1234567],['1.234.5678',12345678],['25.0000,05',250000.05],['25.000,',25000]])assert.equal(moneyFieldNumber(s),n);
 for(const s of ['1..234','1,2,3','abc'])assert.ok(Number.isNaN(moneyFieldNumber(s)));
});
