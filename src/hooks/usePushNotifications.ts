import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      setLastNotification,
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setLastNotification(response.notification);
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  async function registerForPushNotifications() {
    setErrorMessage(null);

    if (!Device.isDevice) {
      setPermissionStatus('device-required');
      setErrorMessage('Push-уведомления проверяются только на реальном устройстве.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BilliardHUB',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (existingPermission.status !== 'granted') {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      setErrorMessage('Разрешение на push-уведомления не выдано.');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      setErrorMessage('EAS projectId не настроен. Запустите eas init или заполните EXPO_PUBLIC_EAS_PROJECT_ID.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    setExpoPushToken(token);

    // TODO: send this token to the backend and bind it to the signed-in user.
    return token;
  }

  return {
    expoPushToken,
    lastNotification,
    permissionStatus,
    errorMessage,
    registerForPushNotifications,
  };
}
