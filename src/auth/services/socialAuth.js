import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';

let isSocialAuthInitialized = false;

export const initSocialAuth = async () => {
  if (isSocialAuthInitialized) return;
  const webClientId =
    import.meta.env.VITE_FIREBASE_GOOGLE_CLIENT_ID ||
    '912871579095-angrtbrl9t2ct1edcufb5kfn607uts5s.apps.googleusercontent.com';
  try {
    if (Capacitor.isNativePlatform()) {
      await SocialLogin.initialize({
        google: {
          webClientId: webClientId,
          mode: 'online',
        },
      });
      isSocialAuthInitialized = true;
    }
  } catch (err) {
    console.warn('SocialLogin initialize note:', err);
  }
};

export const performGoogleAuth = async (auth) => {
  if (Capacitor.isNativePlatform()) {
    await initSocialAuth();
    const loginRes = await SocialLogin.login({
      provider: "google",
      options: {
        forcePrompt: true,
        filterByAuthorizedAccounts: false,
        autoSelectEnabled: false,
      },
    });
    const idToken = loginRes?.result?.idToken || loginRes?.idToken;
    if (!idToken) {
      throw new Error('No Google ID token received from authentication.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } else {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result?.user;
  }
};
