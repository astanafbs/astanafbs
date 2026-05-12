import { Redirect } from 'expo-router';

import { SplashGate } from '../src/widgets/home/SplashGate';

export default function AppIndex() {
  // V1 keeps the app browsable while Firebase/backend credentials are not wired.
  const isBootReady = true;
  const isAuthenticated = true;
  const isProfileComplete = true;

  if (!isBootReady) {
    return <SplashGate state="checking_auth" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (!isProfileComplete) {
    return <Redirect href="/complete-profile" />;
  }

  return <Redirect href="/home" />;
}
