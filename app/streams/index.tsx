import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, SectionHeader, typography } from '../../src/components/ui';
import { streams } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function StreamsScreen() {
  return (
    <Screen title="Трансляции">
      <SectionHeader title="Расписание эфиров" />
      {streams.map((stream) => (
        <Card key={stream.id} href={`/streams/${stream.id}`}>
          <XStack alignItems="center" gap={spacing.sm}>
            <IconBadge icon="stream" tone="quiet" />
            <Badge label={stream.status} tone="warning" />
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {stream.title}
          </Text>
          <Text {...typography.body}>{stream.time}</Text>
        </Card>
      ))}
    </Screen>
  );
}
