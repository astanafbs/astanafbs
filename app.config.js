const { existsSync } = require('node:fs');

const iosBundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER ?? 'kz.fbsastana.app';
const androidPackage = process.env.ANDROID_PACKAGE ?? 'kz.fbsastana.app';
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
const iosGoogleServicesFile = './GoogleService-Info.plist';
const androidGoogleServicesFile = './google-services.json';

module.exports = {
  expo: {
    name: 'BilliardHUB',
    slug: 'billiardhub',
    version: '1.0.0',
    scheme: 'billiardhub',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/preview.jpg',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      ...(existsSync(iosGoogleServicesFile)
        ? { googleServicesFile: iosGoogleServicesFile }
        : {}),
      infoPlist: {
        CFBundleDisplayName: 'BilliardHUB',
        NSUserNotificationsUsageDescription:
          'BilliardHUB отправляет уведомления о турнирах, матчах, трансляциях, объявлениях, новостях и дуэлях.',
      },
    },
    android: {
      package: androidPackage,
      ...(existsSync(androidGoogleServicesFile)
        ? { googleServicesFile: androidGoogleServicesFile }
        : {}),
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
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
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
