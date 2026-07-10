import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SecondaryButton, typography } from '../../src/components/ui';
import { useI18n } from '../../src/shared/lib/i18n';

export default function OnboardingScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t('onboarding.title')}>
      <Card tone="green">
        <Text {...typography.inverseTitle}>{t('onboarding.cardTitle')}</Text>
        <Text {...typography.inverseBody}>{t('onboarding.body')}</Text>
        <SecondaryButton label={t('onboarding.completeProfile')} href="/complete-profile" />
      </Card>
    </Screen>
  );
}
