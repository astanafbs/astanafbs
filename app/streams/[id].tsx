import { useLocalSearchParams } from 'expo-router';
import { Text, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { streams } from '../../src/data/mock';
import { colors, radius, spacing } from '../../src/theme';

export default function StreamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stream = streams.find((item) => item.id === id) ?? streams[0];

  return (
    <Screen title="Эфир">
      <YStack
        minHeight={210}
        borderRadius={radius.lg}
        backgroundColor={colors.cardDark}
        borderWidth={1}
        borderColor={colors.borderSoft}
        alignItems="center"
        justifyContent="center"
        padding={spacing.lg}
      >
        <Text color={colors.textPrimary} fontSize={42} fontWeight="500">
          ▶
        </Text>
        <Text {...typography.inverseBody}>Прямой эфир матча</Text>
      </YStack>

      <Card>
        <Badge label={stream.status} tone="warning" />
        <Text {...typography.title} marginTop={spacing.md}>
          {stream.title}
        </Text>
        <InfoGrid
          items={[
            { label: 'Начало', value: stream.time },
            { label: 'Площадка', value: 'BilliardHUB Almaty' },
          ]}
        />
        <PrimaryButton label="Напомнить о трансляции" />
      </Card>
    </Screen>
  );
}
