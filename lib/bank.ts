import core from './core.json';
import {factualBank,FACT_GROUPS} from './factual';
import {extraQuantitative} from './quantitative';
export type Question={id:string;topic:string;difficulty:string;question:string;options:string[];correct:number;explanation:string;kind:string;subtopic?:string;solutionSteps?:string[];optionExplanations?:string[];sources?:any[];year?:number;basisIds?:string[]};
export const TOPICS=['इतिहास','भूगोल व पर्यावरण','राज्यघटना','अर्थव्यवस्था','विज्ञान','गणित','बुद्धिमत्ता','चालू घडामोडी'];
const fmt=(n:number)=>Number.isInteger(n)?String(n):String(Number(n.toFixed(2)));
function numeric(id:string,topic:string,difficulty:string,question:string,answer:number,explanation:string,unit=''):Question{
 const values=[answer,answer+1,answer+3,answer+7];const shift=Number(id.split('-').pop())%4;
 const options=values.map((_,i)=>fmt(values[(i+shift)%4])+unit);
 return {id,topic,difficulty,question,options,correct:(4-shift)%4,explanation,kind:'generated'};
}
export function makeBank():Question[]{
 const bank:Question[]=(core as Question[]).map(q=>({...q,subtopic:'पूर्व प्रश्नपत्रिका: मूलभूत सराव'}));
 for(let t=0;t<8;t++)for(let i=0;i<1250;i++){
 const a=10+i%50,b=2+Math.floor(i/50),diff=['easy','moderate','hard'][i%3],id=`variant-${t}-${i}`;
 let q:Question;
 if(t===0){const base=1000+i*20,p=[5,10,15,20,25][i%5],answer=base*p/100;q=numeric(id,'गणित',diff,`${base} चे ${p}% किती?`,answer,`${base} × ${p} / 100 = ${fmt(answer)}.`);}
 else if(t===1){const principal=100*a,rate=b,years=2+i%4,answer=principal*rate*years/100;q=numeric(id,'गणित',diff,`₹${principal} वर वार्षिक ${rate}% दराने ${years} वर्षांचे सरळव्याज किती?`,answer,`सरळव्याज = मुद्दल × दर × वर्षे / 100 = ₹${fmt(answer)}.`,' रुपये');}
 else if(t===2){const cost=50*a,profit=b,answer=cost*(100+profit)/100;q=numeric(id,'गणित',diff,`₹${cost} खरेदी किंमत असलेल्या वस्तूवर ${profit}% नफा मिळवण्यासाठी विक्री किंमत किती असावी?`,answer,`विक्री किंमत = ${cost} × (100 + ${profit}) / 100 = ₹${fmt(answer)}.`,' रुपये');}
 else if(t===3){const speed=5*a,hours=b,answer=speed*hours;q=numeric(id,'गणित',diff,`ताशी ${speed} किमी स्थिर वेगाने ${hours} तासांत किती अंतर कापले जाईल?`,answer,`अंतर = वेग × वेळ = ${speed} × ${hours} = ${answer} किमी.`,' किमी');}
 else if(t===4){const length=a,width=b,answer=2*(length+width);q=numeric(id,'गणित',diff,`आयताची लांबी ${length} सेंमी व रुंदी ${width} सेंमी आहे. परिमिती किती?`,answer,`परिमिती = 2 × (लांबी + रुंदी) = 2 × (${length} + ${width}) = ${answer} सेंमी.`,' सेंमी');}
 else if(t===5){const start=a,d=b,answer=start+4*d;q=numeric(id,'बुद्धिमत्ता',diff,`क्रमातील पुढची संख्या निवडा: ${start}, ${start+d}, ${start+2*d}, ${start+3*d}, ?`,answer,`प्रत्येक पायरीला ${d} जोडले जाते. उत्तर ${answer}.`);}
 else if(t===6){const start=a,first=b,answer=start+4*first+6;q=numeric(id,'बुद्धिमत्ता',diff,`क्रमातील पुढची संख्या: ${start}, ${start+first}, ${start+2*first+1}, ${start+3*first+3}, ?`,answer,`फरक अनुक्रमे ${first}, ${first+1}, ${first+2}, ${first+3} आहेत. उत्तर ${answer}.`);}
 else {const left=a,right=b,answer=left+right-1;q=numeric(id,'बुद्धिमत्ता',diff,`एका रांगेत सई डावीकडून ${left} वी आणि उजवीकडून ${right} वी आहे. रांगेत एकूण किती व्यक्ती आहेत?`,answer,`एकूण = डावीकडील क्रमांक + उजवीकडील क्रमांक - 1 = ${left} + ${right} - 1 = ${answer}.`);}
 const initialExplanation=q.explanation;
 const initialValue=q.options[q.correct];
 const subtopic=['टक्केवारी','सरळव्याज','नफा-तोटा','वेळ-वेग-अंतर','क्षेत्रफळ-परिमिती','संख्यामालिका','वाढते फरक असलेली मालिका','क्रमवारी'][t];
 const steps=[`संकल्पना: ${subtopic}.`,initialExplanation,`प्राथमिक उत्तर = ${initialValue}.`];
 // Difficulty reflects actual task complexity; easy variants remain one-step.
 if(diff==='moderate'&&t<5){const v=Number(q.options[q.correct].split(' ')[0]);q={...q,question:q.question+' मिळालेल्या उत्तराच्या दुप्पट संख्येचे मूल्य निवडा.',options:q.options.map(x=>fmt(Number(x.split(' ')[0])*2)+(x.includes(' ')?' '+x.split(' ').slice(1).join(' '):'')),explanation:q.explanation+` नंतर 2 ने गुणा: ${fmt(v*2)}.`};}
 if(diff==='hard'&&t<5){const v=Number(q.options[q.correct].split(' ')[0]);q={...q,question:q.question+' मिळालेल्या मूल्याच्या 20% मध्ये 15 मिळवल्यास किती येईल? (आवश्यक असल्यास दोन दशांशांपर्यंत.)',options:q.options.map(x=>fmt(Number(x.split(' ')[0])*.2+15)),explanation:q.explanation+` पुढील गणना: ${fmt(v)} × 0.20 + 15 = ${fmt(v*.2+15)}.`};}
 if(t>=5&&diff!=='easy'){const v=Number(q.options[q.correct]);const multiplier=diff==='moderate'?2:3;q={...q,question:q.question+` योग्य संख्येच्या ${multiplier} पट संख्येत ${b} मिळवल्यास किती येईल?`,options:q.options.map(x=>fmt(Number(x)*multiplier+b)),explanation:q.explanation+` नंतर ${v} × ${multiplier} + ${b} = ${v*multiplier+b}.`};}
 if(diff==='moderate'&&t<5)steps.push(`अंतिम गणना: ${initialValue.split(' ')[0]} × 2 = ${q.options[q.correct]}.`);
 if(diff==='hard'&&t<5)steps.push(`अंतिम गणना: ${initialValue.split(' ')[0]} × 0.20 + 15 = ${q.options[q.correct]}.`);
 if(t>=5&&diff!=='easy')steps.push(q.explanation.slice(initialExplanation.length));
 bank.push({...q,explanation:'',subtopic,solutionSteps:steps});
 }
 return [...bank,...extraQuantitative(numeric),...factualBank()];
}
export const BANK=makeBank();
export function shuffle<T>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const u=new Uint32Array(1);crypto.getRandomValues(u);const j=u[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function publicQuestion(q:Question){const {correct,explanation,solutionSteps,optionExplanations,sources,basisIds,...safe}=q;return safe;}
export function grade(questions:Question[],answers:Record<string,number>,timings:Record<string,number>){
 let correct=0,wrong=0;const topics:Record<string,{total:number;correct:number;wrong:number;skipped:number;seconds:number}>={};
 const review=questions.map(q=>{const selected=answers[q.id]??null;const ok=selected===q.correct;if(ok)correct++;else if(selected!==null)wrong++;const t=topics[q.topic]??={total:0,correct:0,wrong:0,skipped:0,seconds:0};t.total++;if(ok)t.correct++;else if(selected!==null)t.wrong++;else t.skipped++;t.seconds+=timings[q.id]??0;return {...q,explanation:q.explanation||q.solutionSteps?.join('\n')||'',optionExplanations:q.optionExplanations??q.options.map((option,i)=>i===q.correct?`हा पर्याय योग्य आहे. पायऱ्या व संदर्भानुसार उत्तर: ${option}.`:`हा पर्याय अयोग्य आहे. खालील पायऱ्या व संदर्भानुसार योग्य उत्तर: ${q.options[q.correct]}.`),selected,ok};});
 const subtopics:Record<string,{total:number;correct:number;wrong:number;skipped:number;seconds:number}>={};for(const q of questions){const key=q.topic+' / '+(q.subtopic??'मूलभूत'),t=subtopics[key]??={total:0,correct:0,wrong:0,skipped:0,seconds:0},selected=answers[q.id]??null;t.total++;if(selected===q.correct)t.correct++;else if(selected!==null)t.wrong++;else t.skipped++;t.seconds+=timings[q.id]??0;}
 const score=correct-wrong*.25,percent=score/questions.length*100;
 return {score,percent,correct,wrong,skipped:questions.length-correct-wrong,passed:percent>=50,topics,subtopics,review};
}

function summarize(){const topics:Map<string,any>=new Map(TOPICS.map(topic=>[topic,{topic,count:0,subs:new Map()}]));let generated=0,statements=0,sourced=0;for(const q of BANK){const t=topics.get(q.topic);t.count++;const name=q.subtopic??'मूलभूत';if(!t.subs.has(name))t.subs.set(name,{subtopic:name,count:0,levels:{easy:0,moderate:0,hard:0}});const sub=t.subs.get(name);sub.count++;sub.levels[q.difficulty]++;if(q.kind==='generated')generated++;if(q.kind==='statement')statements++;if(q.kind==='sourced')sourced++;}return {total:BANK.length,foundational:core.length,sourcedFacts:FACT_GROUPS.reduce((n,g)=>n+g.facts.length,0),generated,statements,sourced,topics:[...topics.values()].map(t=>({topic:t.topic,count:t.count,subtopics:[...t.subs.values()]}))};}
export const BANK_SUMMARY=summarize();
export function questionPool(topic:string,subtopic:string,difficulty:string){return BANK.filter(q=>q.topic===topic&&q.difficulty===difficulty&&(subtopic==='all'||q.subtopic===subtopic));}
