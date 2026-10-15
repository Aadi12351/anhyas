import {getAppUser} from '../../session';
import {env} from 'cloudflare:workers';
import {BANK,BANK_SUMMARY,questionPool,TOPICS,shuffle,publicQuestion,grade,Question} from '../../../lib/bank';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const parse=(s:string)=>JSON.parse(s);
function cleanAnswers(input:unknown,questions:Question[]){const output:Record<string,number>={};if(input&&typeof input==='object')for(const q of questions){const v=(input as any)[q.id];if(Number.isInteger(v)&&v>=0&&v<4)output[q.id]=v;}return output;}
function cleanTimings(input:unknown,questions:Question[]){const output:Record<string,number>={};if(input&&typeof input==='object')for(const q of questions){const v=(input as any)[q.id];if(typeof v==='number'&&Number.isFinite(v)&&v>=0)output[q.id]=Math.min(3600,Math.floor(v));}return output;}
async function finish(db:any,row:any){if(row.status==='done')return parse(row.result);const questions=parse(row.questions);const result={...grade(questions,parse(row.answers),parse(row.timings)),finishedAt:Math.min(Date.now(),row.deadline),elapsedSeconds:Math.max(0,Math.floor((Math.min(Date.now(),row.deadline)-row.started_at)/1000))};await db.prepare("UPDATE attempts SET status='done',result=? WHERE id=? AND user_id=? AND status='active'").bind(JSON.stringify(result),row.id,row.user_id).run();const final=await db.prepare('SELECT result FROM attempts WHERE id=? AND user_id=?').bind(row.id,row.user_id).first();return parse(final.result);}
function activeView(row:any){return {id:row.id,topic:row.topic,subtopic:row.subtopic??'all',difficulty:row.difficulty,startedAt:row.started_at,deadline:row.deadline,serverNow:Date.now(),questions:parse(row.questions).map(publicQuestion),answers:parse(row.answers),timings:parse(row.timings)};}
export async function GET(){try{
 const user=await getAppUser();if(!user)return json({error:'कृपया सुरक्षित लॉगिन करा.'},401);const db=env.DB;if(!db)return json({error:'डेटाबेस उपलब्ध नाही.'},503);
 const profile=await db.prepare('SELECT * FROM profiles WHERE user_id=?').bind(user.userId).first();
 const rows=await db.prepare("SELECT id,user_id,topic,subtopic,difficulty,started_at,deadline,status,json_array_length(questions) AS total,CASE WHEN status='active' THEN questions ELSE '[]' END AS questions,answers,timings,json_remove(result,'$.review') AS result FROM attempts WHERE user_id=? ORDER BY started_at DESC LIMIT 50").bind(user.userId).all();let active=null;const history=[];
 for(const row of rows.results as any[]){if(row.status==='active'&&row.deadline<=Date.now()){const result=await finish(db,row);history.push({id:row.id,topic:row.topic,subtopic:row.subtopic??'all',difficulty:row.difficulty,startedAt:row.started_at,total:row.total??parse(row.questions).length,result:{...result,review:undefined}});}else if(row.status==='active')active=activeView(row);else history.push({id:row.id,topic:row.topic,subtopic:row.subtopic??'all',difficulty:row.difficulty,startedAt:row.started_at,total:row.total??parse(row.questions).length,result:{...parse(row.result),review:undefined}});}
 return json({user:{name:user.displayName,email:user.email},profile,history,active,bank:BANK_SUMMARY});
}catch{ return json({error:'माहिती लोड करता आली नाही. पुन्हा प्रयत्न करा.'},500);}}
export async function POST(request:Request){try{
 const user=await getAppUser();if(!user)return json({error:'कृपया लॉगिन करा.'},401);
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'अनधिकृत विनंती.'},403);
 if(Number(request.headers.get('content-length')??0)>50000)return json({error:'विनंती खूप मोठी आहे.'},413);
 const body=await request.json() as any;const db=env.DB;if(!db)return json({error:'डेटाबेस उपलब्ध नाही.'},503);
 if(body.action==='profile'){
 const name=String(body.name??'').trim(),goal=String(body.goal??'').trim();if(name.length<2||name.length>80||goal.length>150)return json({error:'नाव २ ते ८० अक्षरांचे असावे.'},400);
 await db.prepare('INSERT INTO profiles(user_id,name,goal,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,goal=excluded.goal').bind(user.userId,name,goal,Date.now()).run();return json({ok:true});}
 if(body.action==='start'){
 const profile=await db.prepare('SELECT user_id FROM profiles WHERE user_id=?').bind(user.userId).first();if(!profile)return json({error:'आधी तुमची नोंदणी पूर्ण करा.'},400);
 const existing=await db.prepare("SELECT * FROM attempts WHERE user_id=? AND status='active' ORDER BY started_at DESC LIMIT 1").bind(user.userId).first() as any;
 if(existing&&existing.deadline>Date.now())return json({active:activeView(existing)});if(existing)await finish(db,existing);
 const difficulty=body.difficulty;if(!['easy','moderate','hard'].includes(difficulty))return json({error:'काठिण्य पातळी निवडा.'},400);
 const topic=body.topic;if(topic!=='full'&&!TOPICS.includes(topic))return json({error:'वैध विषय निवडा.'},400);
 const subtopic=body.subtopic??'all';if(typeof subtopic!=='string'||(subtopic!=='all'&&!BANK_SUMMARY.topics.find(t=>t.topic===topic)?.subtopics.some(s=>s.subtopic===subtopic)))return json({error:'वैध उपविषय निवडा.'},400);
 const count=body.count;if(![10,25,50,100].includes(count))return json({error:'प्रश्नसंख्या वैध नाही.'},400);
 const recent=await db.prepare("SELECT json_extract(q.value,'$.id') AS id FROM (SELECT questions FROM attempts WHERE user_id=? ORDER BY started_at DESC LIMIT 20) a,json_each(a.questions) q").bind(user.userId).all();const seen=new Set((recent.results as any[]).map(r=>r.id));
 const pick=(pool:Question[],n:number)=>{const fresh=pool.filter(q=>!seen.has(q.id));return [...shuffle(fresh),...shuffle(pool.filter(q=>seen.has(q.id)))].slice(0,n);};
 let selected:Question[]=[];
 if(topic==='full'){
 if(count!==100||subtopic!=='all')return json({error:'पूर्ण सराव परीक्षा १०० प्रश्नांची आहे; स्वतंत्र उपविषय निवडू नका.'},400);
 const allocation:Record<string,number>={'इतिहास':15,'भूगोल व पर्यावरण':15,'राज्यघटना':15,'अर्थव्यवस्था':12,'विज्ञान':15,'गणित':15,'बुद्धिमत्ता':8};
 for(const [t,n] of Object.entries(allocation)){const pool=questionPool(t,'all',difficulty);if(pool.length<n)return json({error:'या पातळीवरील मिश्र पेपरसाठी पुरेसे प्रश्न नाहीत.'},400);selected.push(...pick(pool,n));}
 for(const [year,n] of [['२०२४',2],['२०२५',2],['२०२६',1]] as const)selected.push(...pick(questionPool('चालू घडामोडी',year,difficulty),n));
 }else {const pool=questionPool(topic,subtopic,difficulty);if(count>pool.length)return json({error:`निवडलेल्या विषय / उपविषय / काठिण्यात ${pool.length} प्रश्न आहेत. प्रश्नसंख्या कमी करा किंवा फिल्टर बदला.`},400);selected=pick(pool,count);}
 selected=shuffle(selected).map(q=>{const order=shuffle([0,1,2,3]);return {...q,options:order.map(i=>q.options[i]),correct:order.indexOf(q.correct),...(q.optionExplanations?{optionExplanations:order.map(i=>q.optionExplanations![i])}:{})};});
 if(new Set(selected.map(q=>q.id)).size!==selected.length)return json({error:'प्रश्न निवडीत त्रुटी.'},500);
 const id=crypto.randomUUID(),now=Date.now(),deadline=now+selected.length*36000;
 // One active attempt per learner, including simultaneous start requests.
 const inserted=await db.prepare("INSERT INTO attempts(id,user_id,topic,subtopic,difficulty,started_at,deadline,status,questions,answers,timings) SELECT ?,?,?,?,?,?,?,'active',?,'{}','{}' WHERE NOT EXISTS(SELECT 1 FROM attempts WHERE user_id=? AND status='active')").bind(id,user.userId,topic,subtopic,difficulty,now,deadline,JSON.stringify(selected),user.userId).run();
 if(!inserted.meta.changes)return json({error:'परीक्षा आधीच सुरू आहे. डॅशबोर्ड रिफ्रेश करा.'},409);
 const row=await db.prepare('SELECT * FROM attempts WHERE id=? AND user_id=?').bind(id,user.userId).first();return json({active:activeView(row)});
 }
 if(!['save','submit','review'].includes(body.action))return json({error:'अवैध कृती.'},400);
 const row=await db.prepare('SELECT * FROM attempts WHERE id=? AND user_id=?').bind(String(body.id),user.userId).first() as any;if(!row)return json({error:'परीक्षा सापडली नाही.'},404);
 if(body.action==='review'){if(row.status!=='done'&&row.deadline>Date.now())return json({error:'परीक्षा संपल्यानंतर उत्तरतालिका उपलब्ध होईल.'},409);return json({result:await finish(db,row)});}
 if(row.status==='done')return json({result:parse(row.result)});
 if(Date.now()>=row.deadline)return json({expired:true,result:await finish(db,row)});
 const questions=parse(row.questions);const answers=cleanAnswers(body.answers,questions),timings=cleanTimings(body.timings,questions);
 await db.prepare("UPDATE attempts SET answers=?,timings=? WHERE id=? AND user_id=? AND status='active' AND deadline>?").bind(JSON.stringify(answers),JSON.stringify(timings),row.id,user.userId,Date.now()).run();
 const updated=await db.prepare('SELECT * FROM attempts WHERE id=? AND user_id=?').bind(row.id,user.userId).first();
 if(body.action==='submit')return json({result:await finish(db,updated)});return json({saved:true,serverNow:Date.now()});
}catch{return json({error:'विनंती पूर्ण झाली नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.'},500);}}
