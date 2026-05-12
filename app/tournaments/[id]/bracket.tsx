import { useLocalSearchParams } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { Badge, Card, SectionHeader, typography } from '../../../src/components/ui';
import { players, tournaments } from '../../../src/data/mock';
import { colors, radius, spacing } from '../../../src/theme';

const rounds = ['1/8', '1/4', '1/2', 'Финал'];

export default function TournamentBracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournament = tournaments.find((item) => item.id === id) ?? tournaments[0];

  return (
    <Screen title="Сетка">
      <Card tone="dark">
        <Badge label="online bracket" tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {tournament.title}
        </Text>
      </Card>

      <SectionHeader title="Турнирная сетка" />
      {rounds.map((round, roundIndex) => (
        <Card key={round}>
          <Text {...typography.title}>{round}</Text>
          {[0, 1].map((matchIndex) => {
            const player = players[(roundIndex + matchIndex) % players.length];
            return (
              <XStack
                key={`${round}-${matchIndex}`}
                alignItems="center"
                justifyContent="space-between"
                marginTop={spacing.sm}
                padding={spacing.sm}
                borderRadius={radius.sm}
                backgroundColor={colors.chipDark}
                borderWidth={1}
                borderColor={colors.borderSoft}
              >
                <YStack>
                  <Text color={colors.textPrimary} fontSize={14} fontWeight="600">
                    {player.name}
                  </Text>
                  <Text {...typography.meta}>Стол {matchIndex + 1}</Text>
                </YStack>
                <Badge label={roundIndex < 2 ? 'scheduled' : 'pending'} tone="warning" />
              </XStack>
            );
          })}
        </Card>
      ))}
    </Screen>
  );
}
