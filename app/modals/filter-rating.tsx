import { router } from 'expo-router';
import { Button, Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { getRatingCities } from '../../src/entities/player/api';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

export default function FilterRatingModal() {
  const citiesState = useApiResource(() => getRatingCities().then((result) => result.data));

  function openRating(city?: string) {
    router.replace(city ? `/rating?city=${encodeURIComponent(city)}` : '/rating');
  }

  return (
    <Screen title="Фильтры рейтинга">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Рейтинг игроков</Text>
        <Text {...typography.inverseBody}>Выберите общий рейтинг Казахстана или конкретный город.</Text>
      </Card>

      <SectionHeader title="Город" action={`${citiesState.data?.length ?? 0} городов`} />
      <Card>
        <XStack flexWrap="wrap" gap={spacing.sm}>
          <FilterChip label="Весь КЗ" onPress={() => openRating()} />
          {(citiesState.data ?? []).map((city) => (
            <FilterChip key={city.city} label={`${city.city} · ${city.players_count}`} onPress={() => openRating(city.city)} />
          ))}
        </XStack>
        {citiesState.loading ? <Text {...typography.meta}>Загружаем города...</Text> : null}
        {citiesState.error ? <Text {...typography.meta}>{citiesState.error}</Text> : null}
      </Card>
    </Screen>
  );
}

function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      unstyled
      borderRadius={radius.full}
      backgroundColor={colors.chipDark}
      borderWidth={1}
      borderColor={colors.borderSoft}
      minHeight={38}
      paddingHorizontal={spacing.md}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
    >
      <Text color={colors.textPrimary} fontSize={12} fontWeight="700">
        {label}
      </Text>
    </Button>
  );
}
