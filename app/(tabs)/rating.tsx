import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, IconBadge, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { players } from '../../src/data/mock';
import { colors, spacing } from '../../src/theme';

export default function RatingScreen() {
  return (
    <Screen title="Рейтинг">
      <StatRow
        items={[
          { label: 'лидер', value: players[0].score, icon: 'medal' },
          { label: 'игроков', value: players.length, icon: 'players' },
          { label: 'матчей', value: 128, icon: 'match' },
        ]}
      />

      <SectionHeader title="Таблица игроков" action="сезон" />
      {players.map((player, index) => (
        <Card key={player.id}>
          <XStack alignItems="center" gap={spacing.md}>
            <IconBadge icon={String(index + 1)} tone={index === 0 ? 'accent' : 'quiet'} />
            <YStack flex={1}>
              <Text {...typography.title}>{player.name}</Text>
              <Text {...typography.meta}>{player.club}</Text>
            </YStack>
            <YStack alignItems="flex-end">
              <Text color={colors.brass400} fontSize={17} fontWeight="700">
                {player.score}
              </Text>
              <Text
                color={player.trend.startsWith('-') ? colors.danger500 : colors.success500}
                fontSize={12}
                fontWeight="600"
                marginTop={2}
              >
                {player.trend}
              </Text>
            </YStack>
          </XStack>
        </Card>
      ))}
    </Screen>
  );
}
