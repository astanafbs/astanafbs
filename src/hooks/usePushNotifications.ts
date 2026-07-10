import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { type Href, router } from 'expo-router';
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

function openNotificationRoute(notification: Notifications.Notification) {
  const route = notification.request.content.data?.route;

  if (typeof route !== 'string' || !route.startsWith('/')) {
    return;
  }

  router.push(route as Href);
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      setLastNotification,
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setLastNotification(response.notification);
        openNotificationRoute(response.notification);
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response) return;
      setLastNotification(response.notification);
      openNotificationRoute(response.notification);
    });

    return () => {
      isMounted = false;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  async function registerForPushNotifications() {
    setErrorMessage(null);

    try {
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
      const tokenOptions = projectId ? { projectId } : undefined;

      const token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data;
      setExpoPushToken(token);

      return token;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось получить push-токен устройства.',
      );
      return null;
    }
  }

  return {
    expoPushToken,
    lastNotification,
    permissionStatus,
    errorMessage,
    registerForPushNotifications,
  };
}
