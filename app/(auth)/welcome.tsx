import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, SecondaryButton, typography } from '../../src/components/ui';

export default function WelcomeScreen() {
  return (
    <Screen title="BilliardHUB" eyebrow="Добро пожаловать">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Бильярдное сообщество Казахстана</Text>
        <Text {...typography.inverseBody}>
          Турниры, рейтинги, дуэли, клубы и трансляции для игроков Астаны, Алматы и других городов.
        </Text>
        <PrimaryButton label="Войти через Google" href="/sign-in" />
        <SecondaryButton label="Посмотреть турниры" href="/tournaments" />
      </Card>
    </Screen>
  );
}
