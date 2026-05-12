import { useLocalSearchParams } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Avatar, Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { players } from '../../src/data/mock';
import { colors, spacing } from '../../src/theme';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = players.find((item) => item.id === id) ?? players[0];

  return (
    <Screen title="Игрок">
      <Card tone="dark">
        <XStack alignItems="center" gap={spacing.md}>
          <Avatar initials={player.name.slice(0, 2).toUpperCase()} />
          <YStack flex={1}>
            <Text {...typography.inverseTitle}>{player.name}</Text>
            <Text {...typography.inverseBody}>{player.club}</Text>
          </YStack>
        </XStack>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Рейтинг', value: player.score },
            { label: 'Тренд', value: player.trend },
            { label: 'Город', value: 'Астана' },
            { label: 'Игры', value: 42 },
          ]}
        />
        <PrimaryButton label="Вызвать на дуэль" />
      </Card>

      <SectionHeader title="История игр" />
      {['Победа 5:3', 'Поражение 2:5', 'Победа 5:4'].map((result) => (
        <Card key={result}>
          <Badge label={result.includes('Победа') ? 'win' : 'loss'} tone={result.includes('Победа') ? 'green' : 'warning'} />
          <Text color={colors.textPrimary} fontSize={15} fontWeight="600" marginTop={spacing.sm}>
            {result}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
