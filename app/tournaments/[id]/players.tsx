import { useLocalSearchParams } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { Avatar, Badge, Card, SectionHeader, typography } from '../../../src/components/ui';
import { getTournament, getTournamentPlayers } from '../../../src/entities/tournament/api';
import { useApiResource } from '../../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../../src/theme';

export default function TournamentPlayersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentState = useApiResource(() => getTournament(id).then((result) => result.data), [id]);
  const playersState = useApiResource(() => getTournamentPlayers(id).then((result) => result.data), [id]);
  const tournament = tournamentState.data;
  const players = playersState.data ?? [];

  return (
    <Screen title="Участники">
      <Card tone="green">
        <Text {...typography.inverseTitle}>{tournament?.title ?? 'Турнир'}</Text>
        <Text {...typography.inverseBody}>
          {players.length}/{tournament?.max_players ?? '-'} участников
        </Text>
      </Card>

      <SectionHeader title="Список игроков" />
      {playersState.loading ? <Card><Text {...typography.body}>Загружаем участников...</Text></Card> : null}
      {playersState.error ? <Card><Text {...typography.body}>{playersState.error}</Text></Card> : null}
      {players.map((player, index) => (
        <Card key={player.id} href={`/players/${player.id}`}>
          <XStack alignItems="center" gap={spacing.md}>
            <Avatar initials={player.display_name.slice(0, 2).toUpperCase()} />
            <YStack flex={1}>
              <Text {...typography.title}>{player.display_name}</Text>
              <Text {...typography.meta}>{player.club_name ?? player.city ?? '-'}</Text>
            </YStack>
            <Badge label={`seed ${player.seed_number ?? index + 1}`} tone={index < 2 ? 'green' : 'neutral'} />
          </XStack>
          <Text color={colors.brass400} fontSize={13} fontWeight="600" marginTop={spacing.sm}>
            Рейтинг {player.rating ?? 0}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
