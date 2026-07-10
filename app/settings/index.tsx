import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SecondaryButton, SectionHeader, typography } from '../../src/components/ui';
import { useI18n } from '../../src/shared/lib/i18n';

export default function SettingsScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t('settings.title')}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{t('settings.accountTitle')}</Text>
        <Text {...typography.inverseBody}>{t('settings.accountBody')}</Text>
      </Card>
      <SectionHeader title={t('settings.sections')} />
      <Card>
        <SecondaryButton label={t('settings.editProfile')} href="/settings/edit-profile" />
        <SecondaryButton label={t('settings.language')} href="/settings/language" />
        <SecondaryButton label={t('settings.notifications')} href="/settings/notifications" />
        <SecondaryButton label="Privacy Policy" href="/legal/privacy" />
        <SecondaryButton label="Terms of Use" href="/legal/terms" />
      </Card>
    </Screen>
  );
}
