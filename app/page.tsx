import {getAppUser} from './session';import App from './practice-app';import AuthScreen from './auth-screen';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getAppUser();if(!user)return <AuthScreen/>;return <App identity={user.displayName} signout="/api/auth/logout"/>;}
