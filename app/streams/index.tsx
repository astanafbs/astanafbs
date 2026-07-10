import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, SectionHeader, typography } from '../../src/components/ui';
import { getStreams } from '../../src/entities/stream/api';
import { shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { spacing } from '../../src/theme';

export default function StreamsScreen() {
  const { data: streams, loading, error } = useApiResource(() => getStreams().then((result) => result.data));

  return (
    <Screen title="Трансляции">
      <SectionHeader title="Расписание эфиров" />
      {loading ? <Card><Text {...typography.body}>Загружаем эфиры...</Text></Card> : null}
      {error ? <Card><Text {...typography.body}>{error}</Text></Card> : null}
      {(streams ?? []).map((stream) => (
        <Card key={stream.id} href={`/streams/${stream.id}`}>
          <XStack alignItems="center" gap={spacing.sm}>
            <IconBadge icon="stream" tone="quiet" />
            <Badge label={stream.status} tone="warning" />
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {stream.title}
          </Text>
          {stream.tournament_title ? (
            <Text {...typography.meta}>
              {stream.tournament_title} · {stream.player_a_name ?? 'TBD'} vs {stream.player_b_name ?? 'TBD'}
            </Text>
          ) : null}
          <Text {...typography.body}>{shortDate(stream.starts_at)}</Text>
        </Card>
      ))}
    </Screen>
  );
}
