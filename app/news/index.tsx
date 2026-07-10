import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { AppIcon, Badge, Card, EmptyPanel, SectionHeader, typography } from '../../src/components/ui';
import { getNews } from '../../src/entities/news/api';
import { shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { spacing } from '../../src/theme';

export default function NewsScreen() {
  const { data: news, loading, error } = useApiResource(() => getNews().then((result) => result.data));

  return (
    <Screen title="Новости">
      <SectionHeader title="Опубликовано" action={`${news?.length ?? 0} материалов`} />
      {loading ? <EmptyPanel title="Загружаем новости" body="Показываем только опубликованные материалы." /> : null}
      {error ? <EmptyPanel title="API недоступен" body={error} /> : null}
      {(news ?? []).map((item) => (
        <Card key={item.id} href={`/news/${item.id}`}>
          <XStack alignItems="center" gap={spacing.md}>
            <AppIcon name="listing" color="#D6B56D" size={24} />
            <XStack flex={1} justifyContent="space-between" alignItems="center" gap={spacing.sm}>
              <Badge label="Новости" />
              <Text {...typography.meta}>{shortDate(item.published_at ?? item.created_at)}</Text>
            </XStack>
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {item.title}
          </Text>
          <Text {...typography.body}>{item.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
