import { router } from 'expo-router';
import { Button, Text, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';

const options = [
  { label: 'Активные', body: 'Регистрация, закрытые и текущие турниры.', tab: 'active' },
  { label: 'Скоро', body: 'Турниры с открытой регистрацией.', tab: 'upcoming' },
  { label: 'Архив', body: 'Завершенные турниры.', tab: 'archive' },
];

export default function FilterTournamentsModal() {
  return (
    <Screen title="Фильтры турниров">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Турниры</Text>
        <Text {...typography.inverseBody}>Откройте нужную вкладку списка турниров.</Text>
      </Card>

      <SectionHeader title="Статус" />
      <YStack gap={spacing.sm}>
        {options.map((option) => (
          <Button
            key={option.tab}
            unstyled
            borderRadius={radius.md}
            backgroundColor={colors.cardLight}
            borderWidth={1}
            borderColor={colors.borderSoft}
            padding={spacing.md}
            alignItems="stretch"
            onPress={() => router.replace(`/tournaments?tab=${option.tab}`)}
            pressStyle={{ opacity: 0.82 }}
            style={{ borderWidth: 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
          >
            <Text color={colors.textPrimary} fontSize={16} fontWeight="700">
              {option.label}
            </Text>
            <Text color={colors.textMuted} fontSize={13} lineHeight={18} marginTop={4}>
              {option.body}
            </Text>
          </Button>
        ))}
      </YStack>
    </Screen>
  );
}
