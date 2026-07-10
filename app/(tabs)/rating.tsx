import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, IconBadge, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { getRatingCities, getRatings } from '../../src/entities/player/api';
import { useI18n } from '../../src/shared/lib/i18n';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

export default function RatingScreen() {
  const { t } = useI18n();
  const { city } = useLocalSearchParams<{ city?: string }>();
  const routeCity = typeof city === 'string' && city.trim() ? city : null;
  const [selectedCity, setSelectedCity] = useState<string | null>(routeCity);

  useEffect(() => {
    setSelectedCity(routeCity);
  }, [routeCity]);
  const { data: players, loading, error } = useApiResource(
    () => getRatings({ city: selectedCity }).then((result) => result.data),
    [selectedCity],
  );
  const citiesState = useApiResource(() => getRatingCities().then((result) => result.data));
  const list = players ?? [];
  const totalWins = list.reduce((sum, player) => sum + (Number(player.wins) || 0), 0);
  const allPlayersCount = (citiesState.data ?? []).reduce((sum, city) => sum + Number(city.players_count ?? 0), 0);

  return (
    <Screen title={t('rating.title')}>
      <StatRow
        items={[
          { label: t('rating.leader'), value: list[0]?.rating ?? 0, icon: 'medal' },
          { label: t('rating.players'), value: list.length, icon: 'players' },
          { label: t('rating.wins'), value: totalWins, icon: 'match' },
        ]}
      />

      <SectionHeader title="География рейтинга" action={selectedCity ?? 'Весь Казахстан'} />
      <Card>
        <XStack flexWrap="wrap" gap={spacing.sm}>
          <FilterChip
            label={`Весь КЗ${allPlayersCount ? ` · ${allPlayersCount}` : ''}`}
            active={!selectedCity}
            onPress={() => setSelectedCity(null)}
          />
          {(citiesState.data ?? []).map((city) => (
            <FilterChip
              key={city.city}
              label={`${city.city} · ${city.players_count}`}
              active={selectedCity === city.city}
              onPress={() => setSelectedCity(city.city)}
            />
          ))}
        </XStack>
        {citiesState.error ? (
          <Text {...typography.meta} marginTop={spacing.md}>
            {citiesState.error}
          </Text>
        ) : null}
      </Card>

      <SectionHeader title={t('rating.table')} action={t('rating.season')} />
      {loading ? <Card><Text {...typography.body}>{t('rating.loading')}</Text></Card> : null}
      {error ? <Card><Text {...typography.body}>{error}</Text></Card> : null}
      {!loading && !error && list.length === 0 ? (
        <Card><Text {...typography.body}>Игроков в этом городе пока нет.</Text></Card>
      ) : null}
      {list.map((player, index) => (
        <Card key={player.id} href={`/players/${player.id}`}>
          <XStack alignItems="center" gap={spacing.md}>
            <IconBadge icon={String(index + 1)} tone={index === 0 ? 'accent' : 'quiet'} />
            <YStack flex={1}>
              <Text {...typography.title}>{player.display_name}</Text>
              <Text {...typography.meta}>{[player.club_name, player.city].filter(Boolean).join(' · ') || '-'}</Text>
              {player.profile_status_label ? (
                <Text color={colors.brass400} fontSize={12} fontWeight="600" marginTop={3}>
                  {player.profile_status_label}
                </Text>
              ) : null}
            </YStack>
            <YStack alignItems="flex-end">
              <Text color={colors.brass400} fontSize={17} fontWeight="600">
                {player.rating}
              </Text>
              <Text
                color={colors.success500}
                fontSize={12}
                fontWeight="600"
                marginTop={2}
              >
                {t('rating.winPercent', { value: player.win_percentage ?? 0 })}
              </Text>
            </YStack>
          </XStack>
        </Card>
      ))}
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      unstyled
      borderRadius={radius.full}
      backgroundColor={active ? colors.brass500 : colors.chipDark}
      borderWidth={active ? 0 : 1}
      borderColor={colors.borderSoft}
      minHeight={36}
      paddingHorizontal={spacing.md}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: active ? 0 : 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
    >
      <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="700">
        {label}
      </Text>
    </Button>
  );
}
