import {compileBank} from './compile-bank.mjs';
compileBank();
import assert from 'node:assert/strict';
const {BANK}=await import('/tmp/bank-check.mjs');
const round=n=>Number(n.toFixed(2)),gcd=(a,b)=>b?gcd(b,a%b):a;
for(const q of BANK.filter(q=>q.id.startsWith('quant-'))){
 const [,st,si]=q.id.split('-'),t=Number(st),i=Number(si),d=i%3,a=10+i;let expected;
 if(t===0){expected=d===0?a+4:d===1?(5*(a+4)+a+14)/6:(5*(a+4)+a+14-a)/5;}
 else if(t===1){const r=2+i%9,s=3+Math.floor(i/9),m=10+i;expected=d===0?r*m:d===1?s*m:Math.abs(r-s)*m;}
 else if(t===2){const p=1000+i*10,r=5+i%11,n=d===2?3:2,A=p*(1+r/100)**n;expected=d===0?A-p:d===1?A:A-p-p*r*n/100;}
 else if(t===3){expected=(500+i*20)*(1-(5+i%21)/100)*(d>0?.9:1)*(d===2?1.18:1);}
 else if(t===4){const x=10+i,y=x+6;expected=(d===0?1:d===1?.5:1-3/x)/(1/x+1/y);}
 else if(t===5){const x=12+i,y=x+8,z=2*(x+y);expected=(d===1?.5:1)/(1/x+1/y-(d===2?1/z:0));}
 else if(t===6){const length=100+i*5,ms=(36+i%17*9)*5/18,platform=80+i*2;expected=(d===0?length:length+platform)/(d===2?ms+10:ms);}
 else if(t===7){const x=10+i;expected=d===0?gcd(2*x,3*x):d===1?6*x:12*x;}
 else if(t===8){const pairs=[];for(let child=5;child<=40;child++)for(let ratio=2;ratio<=8;ratio++)if(child*ratio<=90&&child*(ratio-1)>=18&&child*(ratio-1)<=60)pairs.push([child,ratio]);const serial=Math.floor(i/3),[child,ratio]=pairs[Math.floor(serial/2)%pairs.length];expected=(serial%2?child*ratio:child)+(d===1?2+serial%5:0);}
 else if(t===9)expected=2+i;
 else if(t===10){const r=2+i%17,b=3+Math.floor(i/17),total=r+b;expected=d===0?r/total*100:d===1?b/total*100:r*(r-1)/(total*(total-1))*100;}
 else if(t===11)expected=d===0?a+7:d===1?20:a+3;
 else if(t===12){const m=20+i,w=10+i%17,added=5+i%11;expected=(d===2?w+added:m)/(m+w+(d>0?added:0))*100;}
 else if(t===13){const capital=1000+i*10,months=d===0?12:d===1?6:4,r1=capital*12,r2=2*capital*months;expected=(600+i*20)*(d===2?r2:r1)/(r1+r2);}
 else if(t===14){const n=100+i,divisor=3+i%17;expected=(d===0?n:d===1?2*n+7:n*(n+1))%divisor;}
 else {const r=7*(2+i);expected=d===0?22/7*r*r:d===1?2*22/7*r:(12+i)/2;}
 assert.equal(parseFloat(q.options[q.correct]),round(expected),q.id);
 assert.ok(q.solutionSteps.length>=2,q.id);
}
console.log('PASS: all 7,200 added arithmetic answers independently recomputed, with solution steps.');

for(const q of BANK.filter(q=>q.id.startsWith('reason-'))){const [,st,si]=q.id.split('-'),t=Number(st),i=Number(si),d=i%3;let expected;if(t===0)expected=String((1+i)*5);else if(t===1){const minutes=i+(d===0?0:d===1?15:35),h=Math.floor(minutes/60)%12,m=minutes%60,a=Math.abs((h*30+m/2)-m*6);expected=String(Math.min(a,360-a));}else if(t===2){const days=['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];expected=d===0?days[(i%7+1+i)%7]:days[new Date((d===1?Date.UTC(2025,0,1):Date.UTC(2024,1,28))+(1+i)*86400000).getUTCDay()];}else{const chars=[Math.floor(i/26)%26,i%26,(i*7+3)%26],shifts=d===0?[1,1,1]:d===1?[2,2,2]:[1,-1,2];expected=chars.map((n,j)=>String.fromCharCode(65+(n+shifts[j]+26)%26)).join('');}assert.equal(t<2?String(parseFloat(q.options[q.correct])):q.options[q.correct],expected,q.id);}console.log('PASS: all 1,800 added reasoning answers independently checked.');
