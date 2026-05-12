import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function useGoogleAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';

  const isGoogleConfigured = Boolean(
    !isWeb && (googleWebClientId || (Platform.OS === 'ios' && googleIosClientId)),
  );

  useEffect(() => {
    if (isWeb) {
      return undefined;
    }

    GoogleSignin.configure({
      ...(googleWebClientId ? { webClientId: googleWebClientId, offlineAccess: true } : {}),
      ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
      profileImageSize: 160,
      scopes: ['profile', 'email'],
    });

    return auth().onAuthStateChanged(setUser);
  }, []);

  const isReady = useMemo(() => isGoogleConfigured, [isGoogleConfigured]);

  async function signInWithGoogle() {
    if (isWeb) {
      setErrorMessage('Google вход в web-preview отключен. Откройте iOS/Android app для авторизации.');
      return;
    }

    if (!isGoogleConfigured) {
      setErrorMessage('Google Sign-In не настроен. Заполните client IDs и Firebase native config.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const result = await GoogleSignin.signIn();

      if (result.type === 'cancelled') {
        return;
      }

      const idToken = result.data.idToken;

      if (!idToken) {
        throw new Error('Google не вернул idToken. Проверьте webClientId и Firebase config.');
      }

      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function signOutFromGoogle() {
    setErrorMessage(null);

    if (isWeb) {
      setUser(null);
      return;
    }

    await GoogleSignin.signOut().catch(() => null);
    await auth().signOut();
  }

  return {
    user,
    isLoading,
    isReady,
    errorMessage,
    signInWithGoogle,
    signOutFromGoogle,
  };
}

function getAuthErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code);

    if (code.includes('SIGN_IN_CANCELLED')) {
      return null;
    }

    if (code.includes('PLAY_SERVICES')) {
      return 'Google Play Services недоступен или требует обновления.';
    }

    return code;
  }

  return error instanceof Error ? error.message : 'Не удалось войти через Google.';
}
