import {headers} from 'next/headers';import {env} from 'cloudflare:workers';import {currentUser} from '../lib/account-service';
export function authContext(){return {db:env.DB,jwtSecret:env.AUTH_JWT_SECRET??'',pepper:env.AUTH_PASSWORD_PEPPER??''};}
export async function getAppUser(){const h=await headers();return currentUser(h.get('cookie'),authContext());}
