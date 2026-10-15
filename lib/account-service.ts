import {COOKIE_NAME,randomToken,digest,keyedHash,passwordError,hashPassword,checkPassword,signJWT,verifyJWT,cookieToken,sessionCookie,readBody} from './auth-crypto';
export type AuthContext={db:any;jwtSecret:string;pepper:string;legacyUser?:()=>Promise<any>};
export const authJSON=(value:any,status=200,cookie?:string)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}});
export async function currentUser(cookie:string|null,ctx:AuthContext){const token=cookieToken(cookie);if(!token)return null;const claims=await verifyJWT(token,ctx.jwtSecret);if(!claims)return null;const tokenHash=await digest(claims.jti);const row=await ctx.db.prepare('SELECT a.id AS account_id,a.owner_id,a.email,a.email_verified,a.provider_user_id,a.password_hash,p.name,p.goal,s.token_hash,s.created_at AS session_created_at,s.expires_at FROM account_sessions s JOIN user_accounts a ON a.id=s.account_id LEFT JOIN profiles p ON p.user_id=a.owner_id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,Date.now()).first();if(!row||row.owner_id!==claims.sub)return null;return {userId:row.owner_id,accountId:row.account_id,email:row.email,displayName:row.name??row.email,emailVerified:!!row.email_verified,providerLinked:!!row.provider_user_id,hasPassword:!!row.password_hash,sessionHash:tokenHash,sessionCreatedAt:row.session_created_at};}
async function issueSession(account:any,request:Request,ctx:AuthContext,remember=false,checkVersion=false){const jti=randomToken(),now=Date.now(),maxAge=remember?7*86400:12*3600,expires=now+maxAge*1000;await ctx.db.prepare('DELETE FROM account_sessions WHERE account_id=? AND expires_at<=?').bind(account.id,now).run();const bindings=[await digest(jti),account.id,now,expires,(request.headers.get('user-agent')??'Browser').slice(0,180),account.id];if(checkVersion)bindings.push(account.password_hash);const inserted=await ctx.db.prepare('INSERT INTO account_sessions(token_hash,account_id,created_at,expires_at,device) SELECT ?,?,?,?,? FROM user_accounts WHERE id=?'+(checkVersion?' AND password_hash=?':'')).bind(...bindings).run();if(!inserted.meta.changes)throw new Error('Account credentials changed; retry');const token=await signJWT(account.owner_id,jti,expires,ctx.jwtSecret);return sessionCookie(token,maxAge);}
async function limited(key:string,max:number,ctx:AuthContext){const now=Date.now(),window=15*60*1000,k=await keyedHash(key,ctx.pepper);await ctx.db.prepare('INSERT INTO auth_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END').bind(k,now+window,now,now).run();const row=await ctx.db.prepare('SELECT attempts FROM auth_limits WHERE key=?').bind(k).first();return row.attempts>max;}
function emailOf(value:any){return typeof value==='string'?value.trim().toLowerCase():'';}
function validEmail(email:string){return email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);}
async function newRecovery(ctx:AuthContext){const raw=randomToken();return {raw,hashed:await keyedHash('recovery:'+raw,ctx.pepper)};}
async function accountForUser(user:any,ctx:AuthContext){return ctx.db.prepare('SELECT * FROM user_accounts WHERE id=? AND owner_id=?').bind(user.accountId,user.userId).first();}
export async function handleAuth(request:Request,action:string,ctx:AuthContext){try{
 if(!ctx.db||!ctx.jwtSecret||!ctx.pepper)return authJSON({error:'खाते सेवा तयार होत आहे. थोड्या वेळाने पुन्हा प्रयत्न करा.'},503);
 const user=await currentUser(request.headers.get('cookie'),ctx);
 if(request.method==='GET'){
  if(action==='context'){const legacy=await ctx.legacyUser?.();const profile=legacy?await ctx.db.prepare('SELECT name,goal FROM profiles WHERE user_id=?').bind(legacy.userId).first():null;return authJSON({canLink:!!legacy,email:legacy?.email??'',name:profile?.name??legacy?.displayName??'',hasLegacyProgress:!!profile});}
  if(action==='me')return user?authJSON({user:{name:user.displayName,email:user.email,hasPassword:user.hasPassword,emailVerified:user.emailVerified,providerLinked:user.providerLinked}}):authJSON({error:'लॉगिन आवश्यक आहे.'},401);
  if(action==='chatgpt'){
   const legacy=await ctx.legacyUser?.();if(!legacy)return new Response(null,{status:303,headers:{Location:'/signin-with-chatgpt?return_to=%2Fapi%2Fauth%2Fchatgpt','Cache-Control':'no-store'}});
   let account=await ctx.db.prepare('SELECT * FROM user_accounts WHERE provider_user_id=?').bind(legacy.userId).first();
   if(!account){const email=emailOf(legacy.email);const duplicate=await ctx.db.prepare('SELECT id FROM user_accounts WHERE email=?').bind(email).first();if(duplicate)return new Response(null,{status:303,headers:{Location:'/?account=existing','Cache-Control':'no-store'}});const id=crypto.randomUUID();await ctx.db.prepare('INSERT INTO user_accounts(id,owner_id,email,email_verified,provider_user_id,created_at) VALUES(?,?,?,1,?,?)').bind(id,legacy.userId,email,legacy.userId,Date.now()).run();account={id,owner_id:legacy.userId};}
   return new Response(null,{status:303,headers:{Location:'/', 'Set-Cookie':await issueSession(account,request,ctx),'Cache-Control':'no-store'}});
  }
  return authJSON({error:'कृती उपलब्ध नाही.'},404);
 }
 if(request.method!=='POST')return authJSON({error:'अवैध पद्धत.'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return authJSON({error:'अनधिकृत विनंती.'},403);
 const body=await readBody(request);
 if(action==='logout'){if(user)await ctx.db.prepare('DELETE FROM account_sessions WHERE token_hash=? AND account_id=?').bind(user.sessionHash,user.accountId).run();return authJSON({ok:true},200,sessionCookie('',0));}
 if(['register','login','recover'].includes(action)){
  const email=emailOf(body.email);if(!validEmail(email))return authJSON({error:'वैध ईमेल पत्ता द्या.'},400);
  const ip=request.headers.get('cf-connecting-ip')??'unavailable';if(await limited('ip:'+ip,60,ctx)||await limited(action+':'+email,action==='register'?5:10,ctx))return authJSON({error:'खूप प्रयत्न झाले. १५ मिनिटांनी पुन्हा प्रयत्न करा.'},429);
  const passError=passwordError(body.password);if(passError)return authJSON({error:passError},400);
  const account=await ctx.db.prepare('SELECT * FROM user_accounts WHERE email=?').bind(email).first();
  if(action==='login'){
   // A missing account still performs the expensive comparison to reduce timing differences.
   const dummy='$2b$12$LQv3c1yqBWVHxkd0LHAkCOY0fVjwbzXHQfJ9B7BSZ5xJ7tXJIlPxK';
   const valid=await checkPassword(body.password,account?.password_hash??dummy,ctx.pepper);if(!account?.password_hash||!valid)return authJSON({error:'ईमेल किंवा पासवर्ड चुकीचा आहे.'},401);
   return authJSON({ok:true},200,await issueSession(account,request,ctx,body.remember===true,true));
  }
  if(action==='recover'){
   const raw=typeof body.recoveryCode==='string'?body.recoveryCode.trim():'';const expected=await keyedHash('recovery:'+raw,ctx.pepper);if(!account?.recovery_hash||expected!==account.recovery_hash)return authJSON({error:'ईमेल किंवा पुनर्प्राप्ती कोड चुकीचा आहे.'},401);
   const password=await hashPassword(body.password,ctx.pepper),recovery=await newRecovery(ctx);const updated=await ctx.db.prepare('UPDATE user_accounts SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(password,recovery.hashed,account.id,expected).run();if(!updated.meta.changes)return authJSON({error:'हा पुनर्प्राप्ती कोड वापरला गेला आहे.'},409);await ctx.db.prepare('DELETE FROM account_sessions WHERE account_id=?').bind(account.id).run();return authJSON({ok:true,recoveryCode:recovery.raw},200,await issueSession({...account,password_hash:password},request,ctx,false,true));
  }
  if(account)return authJSON({error:'या ईमेलसाठी नोंदणी पूर्ण करता आली नाही. लॉगिन किंवा पुनर्प्राप्ती वापरा.'},409);
  const name=String(body.name??'').trim(),goal=String(body.goal??'MPSC गट क २०२६').trim();if(name.length<2||name.length>80||goal.length>150)return authJSON({error:'नाव २ ते ८० अक्षरांचे व लक्ष्य १५० अक्षरांपर्यंत द्या.'},400);
  const legacy=body.linkLegacy===true?await ctx.legacyUser?.():null;if(body.linkLegacy===true&&(!legacy||emailOf(legacy.email)!==email))return authJSON({error:'जुनी प्रगती जोडण्यासाठी सध्या सत्यापित खात्याचाच ईमेल वापरा.'},403);
  const id=crypto.randomUUID(),owner=legacy?.userId??'account:'+crypto.randomUUID(),password=await hashPassword(body.password,ctx.pepper),recovery=await newRecovery(ctx);
  await ctx.db.batch([ctx.db.prepare('INSERT INTO user_accounts(id,owner_id,email,email_verified,provider_user_id,password_hash,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,owner,email,legacy?1:0,legacy?.userId??null,password,recovery.hashed,Date.now()),ctx.db.prepare('INSERT INTO profiles(user_id,name,goal,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(owner,name,goal,Date.now())]);
  return authJSON({ok:true,recoveryCode:recovery.raw,linkedLegacy:!!legacy},201,await issueSession({id,owner_id:owner},request,ctx));
 }
 if(!user)return authJSON({error:'कृपया लॉगिन करा.'},401);
 if(await limited('security:'+user.accountId,15,ctx))return authJSON({error:'खूप प्रयत्न झाले. १५ मिनिटांनी पुन्हा प्रयत्न करा.'},429);
 if(action==='revoke-others'){await ctx.db.prepare('DELETE FROM account_sessions WHERE account_id=? AND token_hash<>?').bind(user.accountId,user.sessionHash).run();return authJSON({ok:true});}
 if(['password','recovery-code'].includes(action)){
  const account=await accountForUser(user,ctx);if(account.password_hash){if(typeof body.currentPassword!=='string'||!(await checkPassword(body.currentPassword,account.password_hash,ctx.pepper)))return authJSON({error:'सध्याचा पासवर्ड चुकीचा आहे.'},401);}else{const legacy=await ctx.legacyUser?.();if(!legacy||legacy.userId!==account.provider_user_id)return authJSON({error:'पासवर्ड तयार करण्यापूर्वी ChatGPT द्वारे पुन्हा लॉगिन करा.'},403);}
  if(action==='recovery-code'){const recovery=await newRecovery(ctx);await ctx.db.prepare('UPDATE user_accounts SET recovery_hash=? WHERE id=?').bind(recovery.hashed,account.id).run();return authJSON({ok:true,recoveryCode:recovery.raw});}
  const error=passwordError(body.password);if(error)return authJSON({error},400);const record=await hashPassword(body.password,ctx.pepper),recovery=await newRecovery(ctx);await ctx.db.prepare('UPDATE user_accounts SET password_hash=?,recovery_hash=? WHERE id=?').bind(record,recovery.hashed,account.id).run();await ctx.db.prepare('DELETE FROM account_sessions WHERE account_id=?').bind(account.id).run();return authJSON({ok:true,recoveryCode:recovery.raw},200,await issueSession({...account,password_hash:record},request,ctx,false,true));
 }
 return authJSON({error:'कृती उपलब्ध नाही.'},404);
}catch(e:any){if(['BODY_TOO_LARGE','JSON_REQUIRED'].includes(e?.message)||e instanceof SyntaxError)return authJSON({error:'विनंतीचा आकार किंवा स्वरूप योग्य नाही.'},400);return authJSON({error:'खाते सेवा पूर्ण झाली नाही. पुन्हा प्रयत्न करा.'},500);}}
