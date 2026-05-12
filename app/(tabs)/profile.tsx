import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Avatar, Card, PrimaryButton, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { players } from '../../src/data/mock';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { syncPushToken } from '../../src/features/push-token-sync/api';
import { colors, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const { user, isLoading, isReady, errorMessage, signInWithGoogle, signOutFromGoogle } =
    useGoogleAuth();
  const {
    expoPushToken,
    permissionStatus,
    errorMessage: pushErrorMessage,
    lastNotification,
    registerForPushNotifications,
  } = usePushNotifications();

  async function handleEnableNotifications() {
    const token = await registerForPushNotifications();
    if (token) {
      await syncPushToken(token).catch(() => null);
    }
  }

  return (
    <Screen title="Профиль" right={<Avatar initials={getInitials(user?.displayName ?? user?.email)} />}>
      <Card>
        <Avatar initials={getInitials(user?.displayName ?? user?.email)} />
        <Text {...typography.title} marginTop={spacing.md}>
          {user?.displayName ?? 'Игрок BilliardHUB'}
        </Text>
        <Text {...typography.body}>
          {user?.email ? `${user.email} · Google` : 'Астана · общий рейтинг 1840'}
        </Text>
        <PrimaryButton
          label={isLoading ? 'Подключение...' : user ? 'Выйти из аккаунта' : 'Войти через Google'}
          onPress={user ? signOutFromGoogle : signInWithGoogle}
        />
        {!user && !isReady ? (
          <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.sm}>
            Google вход будет доступен после настройки аккаунта.
          </Text>
        ) : null}
        {errorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.sm}>
            {errorMessage}
          </Text>
        ) : null}
      </Card>

      <StatRow
        items={[
          { label: 'рейтинг', value: players[0].score, icon: 'ratingList' },
          { label: 'победы', value: 18, icon: 'medal' },
          { label: 'матчи', value: 25, icon: 'match' },
        ]}
      />

      <SectionHeader title="История игр" />
      {['BilliardHUB Astana Open · победа 5:2', 'Дуэль недели · победа 5:3', 'Лига ветеранов Казахстана · поражение 3:5'].map((result) => (
        <Card key={result}>
          <Text {...typography.title}>{result}</Text>
          <Text {...typography.meta}>Результат подтвержден</Text>
        </Card>
      ))}

      <SectionHeader title="Push-уведомления" />
      <Card>
        <Text {...typography.title}>Уведомления</Text>
        <Text {...typography.body}>
          Турниры, матчи, трансляции, объявления, новости и дуэли.
        </Text>
        <Text color={colors.textSecondary} fontSize={13} fontWeight="600" marginTop={spacing.md}>
          Статус: {permissionStatus}
        </Text>
        {expoPushToken ? (
          <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.sm}>
            {expoPushToken}
          </Text>
        ) : null}
        {lastNotification ? (
          <Text {...typography.meta}>
            Последнее: {lastNotification.request.content.title ?? 'без заголовка'}
          </Text>
        ) : null}
        {pushErrorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.sm}>
            {pushErrorMessage}
          </Text>
        ) : null}
        <PrimaryButton label="Включить уведомления" onPress={handleEnableNotifications} />
      </Card>
    </Screen>
  );
}

function getInitials(value?: string | null) {
  if (!value) {
    return 'BH';
  }

  return value
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
