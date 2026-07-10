import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, SecondaryButton, typography } from '../../src/components/ui';
import { useI18n } from '../../src/shared/lib/i18n';

export default function WelcomeScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t('app.name')} eyebrow={t('auth.welcomeEyebrow')}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{t('auth.welcomeTitle')}</Text>
        <Text {...typography.inverseBody}>{t('auth.welcomeBody')}</Text>
        <PrimaryButton label={t('auth.google')} href="/sign-in" />
        <SecondaryButton label={t('auth.viewTournaments')} href="/tournaments" />
      </Card>
    </Screen>
  );
}
