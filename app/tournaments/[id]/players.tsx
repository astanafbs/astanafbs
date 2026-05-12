import { useLocalSearchParams } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { Avatar, Badge, Card, SectionHeader, typography } from '../../../src/components/ui';
import { players, tournaments } from '../../../src/data/mock';
import { colors, spacing } from '../../../src/theme';

export default function TournamentPlayersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournament = tournaments.find((item) => item.id === id) ?? tournaments[0];

  return (
    <Screen title="Участники">
      <Card tone="green">
        <Text {...typography.inverseTitle}>{tournament.title}</Text>
        <Text {...typography.inverseBody}>
          {tournament.players}/{tournament.maxPlayers} участников
        </Text>
      </Card>

      <SectionHeader title="Список игроков" />
      {players.map((player, index) => (
        <Card key={player.id}>
          <XStack alignItems="center" gap={spacing.md}>
            <Avatar initials={player.name.slice(0, 2).toUpperCase()} />
            <YStack flex={1}>
              <Text {...typography.title}>{player.name}</Text>
              <Text {...typography.meta}>{player.club}</Text>
            </YStack>
            <Badge label={`seed ${index + 1}`} tone={index < 2 ? 'green' : 'neutral'} />
          </XStack>
          <Text color={colors.brass400} fontSize={13} fontWeight="600" marginTop={spacing.sm}>
            Рейтинг {player.score}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
