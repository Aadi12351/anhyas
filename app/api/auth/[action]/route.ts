import {handleAuth} from '../../../../lib/account-service';import {authContext} from '../../../session';import {getChatGPTUser} from '../../../chatgpt-auth';
export const dynamic='force-dynamic';
async function handle(request:Request,context:{params:Promise<{action:string}>}){const {action}=await context.params;return handleAuth(request,action,{...authContext(),legacyUser:getChatGPTUser});}
export const GET=handle;export const POST=handle;
