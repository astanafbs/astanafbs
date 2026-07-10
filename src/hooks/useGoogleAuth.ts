export function useGoogleAuth() {
  return {
    user: null,
    isLoading: false,
    isReady: false,
    errorMessage: 'Авторизация временно отключена в MVP-сборке.',
    signInWithGoogle: async () => undefined,
    signOutFromGoogle: async () => undefined,
  };
}
