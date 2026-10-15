import groups from './facts.json';
export const FACT_GROUPS=groups;
function rng(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function selectedIndices(n:number,k:number,random:()=>number){const set=new Set<number>();while(set.size<k)set.add(Math.floor(random()*n));return [...set].sort((a,b)=>a-b);}
const render=(fact:any,state:number)=>fact.statement.replace('{x}',state===0?fact.answer:fact.wrong[state-1]);
export function factualBank(){const output:any[]=[];
 for(let g=0;g<groups.length;g++){
 const group=groups[g],facts=group.facts;
 // Direct questions supplement, rather than replace, the structured variants.
 facts.forEach((fact:any,i:number)=>output.push({id:`source-${g}-${i}`,topic:group.topic,subtopic:group.subtopic,difficulty:'easy',question:fact.statement.replace('{x}','_____')+' योग्य पर्याय निवडा.',options:[fact.answer,...fact.wrong],correct:0,explanation:'',solutionSteps:[render(fact,0)],kind:'sourced',year:fact.year??undefined,sources:[fact],basisIds:[fact.id]}));
 for(const difficulty of ['easy','moderate','hard']){
 const random=rng(10000+g*103+(difficulty==='easy'?1:difficulty==='moderate'?2:3)),used=new Set<string>();let count=0,trials=0;
 while(count<200&&trials++<100000){
 const k=difficulty==='easy'?4:difficulty==='moderate'?2:3,indices=selectedIndices(facts.length,k,random),basis=indices.map(i=>facts[i]);let states=indices.map(()=>Math.floor(random()*4));
 if(difficulty==='easy'){states=indices.map(()=>1+Math.floor(random()*3));states[Math.floor(random()*k)]=0;}
 const signature=indices.map((n,i)=>n+':'+states[i]).join('|');if(used.has(signature))continue;used.add(signature);
 const statements=basis.map((fact:any,i:number)=>render(fact,states[i]));let options:string[],correct:number;
 const truePositions=states.map((state,i)=>state===0?i+1:0).filter(Boolean);
 const choice=(positions:number[])=>positions.length===0?'एकही विधान योग्य नाही':positions.length===k?'सर्व विधाने योग्य आहेत':'फक्त विधान '+positions.join(' व ')+' योग्य '+(positions.length===1?'आहे':'आहेत');
 if(difficulty==='easy'){options=['विधान १','विधान २','विधान ३','विधान ४'];correct=states.indexOf(0);}
 else if(k===2){options=[choice([1]),choice([2]),choice([1,2]),choice([])];correct=truePositions.length===2?2:truePositions.length===0?3:truePositions[0]-1;}
 else {const mask=states.reduce((sum,state,i)=>sum+(state===0?1<<i:0),0);const masks=[mask];while(masks.length<4){const m=Math.floor(random()*8);if(!masks.includes(m))masks.push(m);}options=masks.map(m=>choice([1,2,3].filter((_,i)=>(m&(1<<i))!==0)));correct=0;}
 const proof=basis.map((fact:any,i:number)=>`विधान ${i+1}: ${states[i]===0?'योग्य':'अयोग्य'}. योग्य तथ्य: ${render(fact,0)}`);
 output.push({id:`concept-${g}-${difficulty}-${count++}`,topic:group.topic,subtopic:group.subtopic,difficulty,question:`${difficulty==='easy'?'पुढील विधानांपैकी एकमेव योग्य विधान निवडा.':'पुढील विधानांचा विचार करून योग्य पर्याय निवडा.'}\n${statements.map((s,i)=>`${i+1}. ${s}`).join('\n')}`,options,correct,explanation:'',solutionSteps:proof,kind:'statement',year:basis[0].year??undefined,sources:basis,basisIds:basis.map((f:any)=>f.id)});
 }
 if(count!==200)throw new Error('Insufficient unique factual variants: '+group.subtopic);
 }
 }
 return output;
}
