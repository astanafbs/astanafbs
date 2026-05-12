import { router, useLocalSearchParams } from 'expo-router';
import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { players, tournaments } from '../../src/data/mock';
import { colors, spacing } from '../../src/theme';

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournament = tournaments.find((item) => item.id === id) ?? tournaments[0];

  return (
    <Screen title="Карточка турнира">
      <Card tone="dark">
        <XStack alignItems="center" gap={spacing.sm}>
          <IconBadge icon="tournament" tone="quiet" />
          <Badge label={tournament.status} tone="green" />
        </XStack>
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {tournament.title}
        </Text>
        <Text {...typography.inverseBody}>
          {tournament.place} · {tournament.fullDate}
        </Text>
        <PrimaryButton label="Зарегистрироваться" />
      </Card>

      <SectionHeader title="Информация" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Дата', value: tournament.fullDate },
            { label: 'Место', value: tournament.place },
            { label: 'Адрес', value: tournament.location },
            { label: 'Взнос', value: tournament.fee },
            { label: 'Игроки', value: `${tournament.players}/${tournament.maxPlayers}` },
            { label: 'Призовой', value: tournament.prize },
          ]}
        />
      </Card>

      <SectionHeader title="Турнирная сетка" action="онлайн" />
      <Card>
        {['1/8 финала', '1/4 финала', 'Полуфинал', 'Финал'].map((round, index) => (
          <Text
            key={round}
            color={colors.textSecondary}
            fontSize={14}
            lineHeight={22}
            fontWeight="600"
            paddingVertical={spacing.xs}
          >
            {round}: {index < 2 ? 'формируется' : 'ожидает результатов'}
          </Text>
        ))}
      </Card>

      <SectionHeader title="Онлайн результаты" />
      {players.slice(0, 3).map((player, index) => (
        <Card key={player.id}>
          <Text {...typography.title}>
            Стол {index + 1}: {player.name}
          </Text>
          <Text {...typography.meta}>{index === 0 ? 'идет матч · 3:2' : 'ожидает начала'}</Text>
        </Card>
      ))}

      <PrimaryButton label="Назад к турнирам" onPress={() => router.back()} />
    </Screen>
  );
}
