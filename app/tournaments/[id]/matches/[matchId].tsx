import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../../../src/components/Screen';
import { Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../../../src/components/ui';
import { players, tournaments } from '../../../../src/data/mock';

export default function MatchDetailsScreen() {
  const { id, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const tournament = tournaments.find((item) => item.id === id) ?? tournaments[0];
  const playerA = players[0];
  const playerB = players[1];

  return (
    <Screen title="Матч">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{playerA.name}</Text>
        <Text {...typography.inverseBody}>vs {playerB.name}</Text>
      </Card>
      <SectionHeader title="Онлайн результат" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Турнир', value: tournament.title },
            { label: 'Матч', value: matchId ?? 'match-1' },
            { label: 'Стол', value: 1 },
            { label: 'Счет', value: '3:2' },
          ]}
        />
        <PrimaryButton label="Обновить счет" />
      </Card>
    </Screen>
  );
}
