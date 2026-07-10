import { LanguageSelector } from '../../src/components/LanguageSelector';
import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { useI18n } from '../../src/shared/lib/i18n';
import { Text } from 'tamagui';

export default function LanguageSettingsScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t('language.title')}>
      <SectionHeader title={t('settings.languageAvailable')} />
      <Card>
        <Text {...typography.body}>{t('language.select')}</Text>
        <LanguageSelector />
      </Card>
    </Screen>
  );
}
