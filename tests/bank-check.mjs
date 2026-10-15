import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileBank} from './compile-bank.mjs';
compileBank();
const {BANK,BANK_SUMMARY,questionPool,grade,shuffle,publicQuestion}=await import('/tmp/bank-check.mjs');
assert.equal(BANK.length,BANK_SUMMARY.total);assert.equal(new Set(BANK.map(q=>q.id)).size,BANK.length);assert.equal(new Set(BANK.map(q=>q.question+JSON.stringify(q.options))).size,BANK.length);
for(const q of BANK){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.correct>=0&&q.correct<=3);assert.ok(q.options.every(o=>o.trim().length>0));assert.ok(!('correct' in publicQuestion(q)));assert.ok(!('explanation' in publicQuestion(q)));}
const qs=BANK.slice(0,100);const perfect=Object.fromEntries(qs.map(q=>[q.id,q.correct]));assert.equal(grade(qs,perfect,{}).score,100);assert.equal(grade(qs,{},{}).score,0);const wrong=Object.fromEntries(qs.map(q=>[q.id,(q.correct+1)%4]));assert.equal(grade(qs,wrong,{}).score,-25);const half=Object.fromEntries(qs.slice(0,50).map(q=>[q.id,q.correct]));assert.equal(grade(qs,half,{}).passed,true);const below=Object.fromEntries(qs.slice(0,49).map(q=>[q.id,q.correct]));assert.equal(grade(qs,below,{}).passed,false);assert.equal(new Set(shuffle(qs).map(q=>q.id)).size,100);
for(const q of BANK.filter(q=>q.id.startsWith('variant-'))){const [,tStr,iStr]=q.id.split('-');const t=Number(tStr),i=Number(iStr),a=10+i%50,b=2+Math.floor(i/50);let expected;
 if(t===0)expected=(1000+i*20)*[5,10,15,20,25][i%5]/100;
 else if(t===1)expected=100*a*b*(2+i%4)/100;
 else if(t===2)expected=50*a*(100+b)/100;
 else if(t===3)expected=5*a*b;
 else if(t===4)expected=2*(a+b);
 else if(t===5)expected=a+4*b;
 else if(t===6)expected=a+4*b+6;
 else expected=a+b-1;
 if(t<5&&q.difficulty==='moderate')expected*=2;
 if(t<5&&q.difficulty==='hard')expected=expected*.2+15;
 if(t>=5&&q.difficulty!=='easy')expected=expected*(q.difficulty==='moderate'?2:3)+b;
 assert.equal(Number(q.options[q.correct].split(' ')[0]),Number(expected.toFixed(2)),q.id);
}
console.log('PASS: unique bank IDs and MCQs, legacy numeric answers, unique options, solution/key privacy, shuffle, scoring and 50% boundary.');

for(const topic of BANK_SUMMARY.topics){for(const sub of topic.subtopics){if(sub.subtopic.startsWith('पूर्व'))continue;for(const d of ['easy','moderate','hard'])assert.ok(questionPool(topic.topic,sub.subtopic,d).length>=100,topic.topic+' / '+sub.subtopic+' / '+d);}}
for(const q of BANK){const publicQ=publicQuestion(q);assert.ok(!('solutionSteps' in publicQ));assert.ok(!('optionExplanations' in publicQ));}
console.log(JSON.stringify({total:BANK.length,generated:BANK_SUMMARY.generated,statements:BANK_SUMMARY.statements,sourcedFacts:BANK_SUMMARY.sourcedFacts,subtopics:BANK_SUMMARY.topics.reduce((n,t)=>n+t.subtopics.filter(s=>!s.subtopic.startsWith('पूर्व')).length,0),heapMB:Math.round(process.memoryUsage().heapUsed/1048576)}));
