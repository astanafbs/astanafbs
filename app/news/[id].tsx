import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, typography } from '../../src/components/ui';
import { getNewsPost } from '../../src/entities/news/api';
import { shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { spacing } from '../../src/theme';

export default function NewsDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, error } = useApiResource(() => getNewsPost(id).then((result) => result.data), [id]);

  if (!item) {
    return (
      <Screen title="Новость">
        <Card><Text {...typography.body}>{error ?? 'Загружаем новость...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Новость">
      <Card tone="dark">
        <Badge label="Новости" tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {item.title}
        </Text>
        <Text {...typography.inverseBody}>{shortDate(item.published_at ?? item.created_at)}</Text>
      </Card>
      <Card>
        <Text {...typography.body}>{item.body}</Text>
      </Card>
    </Screen>
  );
}
