import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SecondaryButton, typography } from '../../src/components/ui';

export default function OnboardingScreen() {
  return (
    <Screen title="Онбординг">
      <Card tone="green">
        <Text {...typography.inverseTitle}>Три шага до игры</Text>
        <Text {...typography.inverseBody}>Профиль, рейтинг, ближайший турнир.</Text>
        <SecondaryButton label="Заполнить профиль" href="/complete-profile" />
      </Card>
    </Screen>
  );
}
