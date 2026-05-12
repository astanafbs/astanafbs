import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { spacing } from '../../src/theme';

export default function LanguageSettingsScreen() {
  return (
    <Screen title="Язык">
      <SectionHeader title="Доступные языки" />
      {[
        ['Русский', 'ru'],
        ['Қазақша', 'kk'],
      ].map(([label, code]) => (
        <Card key={code}>
          <Badge label={code} tone={code === 'ru' ? 'green' : 'neutral'} />
          <Text {...typography.title} marginTop={spacing.md}>
            {label}
          </Text>
        </Card>
      ))}
      <PrimaryButton label="Применить" />
    </Screen>
  );
}
