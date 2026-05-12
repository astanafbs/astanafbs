import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, typography } from '../../src/components/ui';
import { news } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function NewsDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = news.find((entry) => entry.id === id) ?? news[0];

  return (
    <Screen title="Новость">
      <Card tone="dark">
        <Badge label={item.tag} tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {item.title}
        </Text>
        <Text {...typography.inverseBody}>{item.meta}</Text>
      </Card>
      <Card>
        <Text {...typography.body}>
          Здесь будет полная новость клуба или турнира: детали события, расписание,
          участники и важные обновления для игроков.
        </Text>
      </Card>
    </Screen>
  );
}
