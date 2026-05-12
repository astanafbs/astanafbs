import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { products } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = products.find((item) => item.id === id) ?? products[0];

  return (
    <Screen title="Товар">
      <Card tone="dark">
        <Badge label={product.status} tone={product.status === 'В наличии' ? 'green' : 'warning'} />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {product.title}
        </Text>
        <Text {...typography.inverseBody}>{product.price}</Text>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Наличие', value: product.status },
            { label: 'Доставка', value: 'Казахстан' },
            { label: 'Оплата', value: 'после подтверждения' },
          ]}
        />
        <PrimaryButton label="Оформить заказ" />
      </Card>
    </Screen>
  );
}
