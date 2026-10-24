import test from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedTransition,inquirySchema,parseId} from '../src/policy.js';
test('valid workflow only allows New → In Progress → Resolved',()=>{
 assert.equal(isAllowedTransition('New','In Progress'),true);
 assert.equal(isAllowedTransition('In Progress','Resolved'),true);
 assert.equal(isAllowedTransition('New','Resolved'),false);
 assert.equal(isAllowedTransition('Resolved','New'),false);
});
test('backend rejects missing customer name and too-short description',()=>{
 const parsed=inquirySchema.safeParse({customer_name:'',contact_details:'0771234567',subject:'Help',description:'Short'});
 assert.equal(parsed.success,false);
 assert.ok(parsed.error.flatten().fieldErrors.customer_name);
 assert.ok(parsed.error.flatten().fieldErrors.description);
});
test('invalid identifiers rejected',()=>{assert.equal(parseId('abc'),null);assert.equal(parseId('-1'),null);assert.equal(parseId('12'),12);});
