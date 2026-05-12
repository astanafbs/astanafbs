import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SecondaryButton, SectionHeader, typography } from '../../src/components/ui';

export default function SettingsScreen() {
  return (
    <Screen title="Настройки">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Аккаунт BilliardHUB</Text>
        <Text {...typography.inverseBody}>Профиль, язык, уведомления и выход из аккаунта.</Text>
      </Card>
      <SectionHeader title="Разделы" />
      <Card>
        <SecondaryButton label="Редактировать профиль" href="/settings/edit-profile" />
        <SecondaryButton label="Язык приложения" href="/settings/language" />
        <SecondaryButton label="Уведомления" href="/settings/notifications" />
        <SecondaryButton label="Privacy Policy" href="/legal/privacy" />
        <SecondaryButton label="Terms of Use" href="/legal/terms" />
      </Card>
    </Screen>
  );
}
