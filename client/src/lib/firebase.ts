import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = !!config.apiKey;

// Opens the Google popup and returns a Firebase ID token for our server to verify
export async function getGoogleIdToken(): Promise<string> {
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const token = await result.user.getIdToken();
  await signOut(auth); // our own cookie session is the source of truth
  return token;
}