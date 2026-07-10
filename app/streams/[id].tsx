import * as Notifications from 'expo-notifications';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { YouTubeLivePlayer } from '../../src/components/YouTubeLivePlayer';
import { getStream, getStreamPlayerSource } from '../../src/entities/stream/api';
import { syncPushToken } from '../../src/features/push-token-sync/api';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

export default function StreamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: stream, error } = useApiResource(() => getStream(id).then((result) => result.data), [id]);
  const { errorMessage, registerForPushNotifications } = usePushNotifications();
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  async function handleReminder() {
    if (!stream) return;
    setReminderMessage(null);

    const token = await registerForPushNotifications();
    if (token) {
      await syncPushToken(token).catch(() => null);
    }

    if (!stream.starts_at) {
      setReminderMessage('Время трансляции не указано, напоминание пока нельзя поставить.');
      return;
    }

    const startsAt = new Date(stream.starts_at);
    const reminderAt = new Date(startsAt.getTime() - 60 * 60 * 1000);
    const triggerDate = reminderAt.getTime() > Date.now() + 60 * 1000
      ? reminderAt
      : new Date(Date.now() + 60 * 1000);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Трансляция скоро начнется',
          body: stream.title,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      setReminderMessage(`Напоминание поставлено на ${triggerDate.toLocaleString('ru-RU')}.`);
    } catch (reason) {
      setReminderMessage(reason instanceof Error ? reason.message : 'Не удалось поставить напоминание');
    }
  }

  if (!stream) {
    return (
      <Screen title="Эфир">
        <Card><Text {...typography.body}>{error ?? 'Загружаем эфир...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Эфир">
      <YouTubeLivePlayer playerSource={getStreamPlayerSource(stream.id)} title={stream.title} />

      <Card>
        <Badge label={stream.status} tone="warning" />
        <Text {...typography.title} marginTop={spacing.md}>
          {stream.title}
        </Text>
        <InfoGrid
          items={[
            { label: 'Начало', value: shortDate(stream.starts_at) },
            { label: 'Турнир', value: stream.tournament_title ?? '-' },
            { label: 'Раунд', value: stream.round_name ?? '-' },
            { label: 'Матч', value: `${stream.player_a_name ?? 'TBD'} vs ${stream.player_b_name ?? 'TBD'}` },
          ]}
        />
        {errorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {errorMessage}
          </Text>
        ) : null}
        {reminderMessage ? (
          <Text color={colors.textMuted} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {reminderMessage}
          </Text>
        ) : null}
        <PrimaryButton label="Напомнить о трансляции" onPress={handleReminder} />
      </Card>
    </Screen>
  );
}
