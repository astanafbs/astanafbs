import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { spacing } from '../../src/theme';

export default function NotificationSettingsScreen() {
  const { expoPushToken, permissionStatus } = usePushNotifications();
  const isRegistered = Boolean(expoPushToken) && permissionStatus === 'granted';

  return (
    <Screen title="Уведомления">
      <Card tone="dark">
        <Badge label={isRegistered ? 'включены' : 'не включены'} tone={isRegistered ? 'green' : 'warning'} />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          Уведомления
        </Text>
        <Text {...typography.inverseBody}>Турниры, матчи, трансляции, объявления, новости и дуэли.</Text>
      </Card>
      <SectionHeader title="Состояние" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Статус', value: isRegistered ? 'активны' : 'ожидает разрешения' },
            { label: 'Устройство', value: expoPushToken ? 'подключено' : 'не подключено' },
          ]}
        />
        <PrimaryButton label="Включить уведомления" />
      </Card>
    </Screen>
  );
}
