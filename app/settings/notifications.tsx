import { useState } from 'react';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { syncPushToken } from '../../src/features/push-token-sync/api';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useI18n } from '../../src/shared/lib/i18n';
import { colors, spacing } from '../../src/theme';

export default function NotificationSettingsScreen() {
  const { t } = useI18n();
  const { expoPushToken, permissionStatus, errorMessage, registerForPushNotifications } = usePushNotifications();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const isRegistered = Boolean(expoPushToken) && permissionStatus === 'granted';

  async function handleEnableNotifications() {
    setSyncMessage(null);
    const token = await registerForPushNotifications();
    if (!token) return;

    try {
      await syncPushToken(token);
      setSyncMessage('Уведомления подключены к вашему профилю.');
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Не удалось синхронизировать push-токен');
    }
  }

  return (
    <Screen title={t('settings.notifications')}>
      <Card tone="dark">
        <Badge
          label={isRegistered ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled')}
          tone={isRegistered ? 'green' : 'warning'}
        />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {t('settings.notifications')}
        </Text>
        <Text {...typography.inverseBody}>{t('settings.notificationsBody')}</Text>
      </Card>
      <SectionHeader title={t('settings.state')} />
      <Card>
        <InfoGrid
          items={[
            { label: t('settings.status'), value: isRegistered ? t('settings.active') : t('settings.waitingPermission') },
            { label: t('settings.device'), value: expoPushToken ? t('settings.deviceConnected') : t('settings.deviceDisconnected') },
          ]}
        />
        {errorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {errorMessage}
          </Text>
        ) : null}
        {syncMessage ? (
          <Text color={colors.textMuted} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {syncMessage}
          </Text>
        ) : null}
        <PrimaryButton label={t('profile.enableNotifications')} onPress={handleEnableNotifications} />
      </Card>
    </Screen>
  );
}
