const {property, arb} = require('@grunmouse/prover');
const assert = require('assert');

const sample = require('./sample-automat.js');

const {
	reverseDFA,
	determineNFA
} = require('../automat.js');

const abc = [...arb.latLow.all()].map(a=>String.fromCodePoint(a));


describe('sample', ()=>{
	property('one string DFA', 
		arb.string(arb.array(arb.integer(3,5), arb.latLow)), 
		arb.string(arb.array(arb.integer(3,5), arb.latLow)), 
		(str, t)=>{
			const A = sample.oneString(str, abc);

			const res = A.run(str);
			
			assert.ok(A.T.has(res), 'accept same string');
			if(t != str){
				assert.ok(!A.T.has(A.run(t)), 'not accept another string');
			}
		}
	);
});

describe('inverse & determine', ()=>{
	property('one string DFA', 
		arb.string(arb.array(arb.integer(3,5), arb.latLow)), 
		arb.string(arb.array(arb.integer(3,5), arb.latLow)), 
		(str, t)=>{
			const A = sample.oneString(str, abc);
			
			const NF = reverseDFA(A);
			//console.log(A);
			//console.log(NF);
			const revStr = str.split('').reverse().join('');
			const res = NF.run(revStr);
			
			assert.ok(NF.hasAccept(res), 'accept reverse string');
			assert.ok(!NF.hasAccept(NF.run(t)), 'not accept another string');

			const notA = determineNFA(NF);
			debugger;
		}
	);
	
});

describe('operation', ()=>{
	property('union DFA', 
		arb.array(3, arb.string(arb.array(arb.integer(3,5), arb.latLow))),
		(arr)=>{
			const [a, b, c] = arr;
			const A = sample.oneString(a, abc);
			const B = sample.oneString(b, abc);
			
			const AB = A.union(B);
			
			//console.log(A.Q.size, B.Q.size, AB.Q.size);
			
			assert.ok(AB.T.has(AB.run(a)), 'accept string a');
			assert.ok(AB.T.has(AB.run(b)), 'accept string b');
			
			if(a != c && b != c){
				assert.ok(!AB.T.has(AB.run(c)), 'not accept string c');
			}
		}
	);
	property('intersection DFA', 
		arb.array(3, arb.string(arb.array(arb.integer(3,5), arb.latLow))),
		(arr)=>{
			const [a, b, c] = arr;
			const A = sample.oneString(a, abc);
			const B = sample.oneString(b, abc);
			const C = sample.oneString(c, abc);

			//const AB = A.union(B);
			//const AC = A.union(C);
			
			//const A1 = AB.intersection(AC);
			
			//assert.ok(A1.T.has(A1.run(a)), 'accept string a');
			
			if(a != b){
				//assert.ok(!A1.T.has(A1.run(b)), 'not accept string b');
			}
			if(a != c){
				//assert.ok(!A1.T.has(A1.run(c)), 'not accept string c');
			}
		}
	);
});