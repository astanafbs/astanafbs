const iosBundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER ?? 'kz.fbsastana.app';
const androidPackage = process.env.ANDROID_PACKAGE ?? 'kz.fbsastana.app';
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'f466de29-d1c9-42d2-a8fb-5bfcacfdf58b';

module.exports = {
  expo: {
    name: 'BilliardHUB',
    slug: 'billiardhub',
    version: '1.0.0',
    scheme: 'billiardhub',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/previewlogo.png',
      resizeMode: 'cover',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      infoPlist: {
        CFBundleDisplayName: 'BilliardHUB',
        UIBackgroundModes: ['fetch', 'remote-notification'],
        NSUserNotificationsUsageDescription:
          'BilliardHUB отправляет уведомления о турнирах, матчах, трансляциях, объявлениях, новостях и дуэлях.',
      },
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0B1220',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['POST_NOTIFICATIONS'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    notification: {
      color: '#22C55E',
      androidMode: 'default',
      androidCollapsedTitle: 'BilliardHUB',
    },
    plugins: [
      'expo-router',
      [
        'expo-screen-orientation',
        {
          initialOrientation: 'PORTRAIT_UP',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#22C55E',
          defaultChannel: 'default',
          mode: 'production',
        },
      ],
    ],
    extra: {
      eas: easProjectId
        ? {
            projectId: easProjectId,
          }
        : undefined,
    },
  },
};
