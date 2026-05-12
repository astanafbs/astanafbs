import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { AppCard, Badge, IconBadge, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { products } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ShopScreen() {
  return (
    <Screen title="Магазин">
      <SectionHeader title="Инвентарь" action="в наличии" />
      <XStack flexWrap="wrap" gap={spacing.sm}>
        {products.map((product) => (
          <AppCard
            key={product.id}
            width="48.5%"
            minHeight={210}
            padding={spacing.md}
            marginBottom={0}
            pressStyle={{ opacity: 0.9 }}
          >
            <YStack flex={1} justifyContent="space-between">
              <YStack gap={spacing.sm}>
                <XStack justifyContent="space-between" alignItems="center" gap={spacing.sm}>
                  <IconBadge icon="product" tone="quiet" />
                  <Badge label={product.status} tone={product.status === 'В наличии' ? 'green' : 'warning'} />
                </XStack>
                <Text {...typography.title} fontSize={15} lineHeight={20}>
                  {product.title}
                </Text>
                <Text {...typography.body} marginTop={0}>
                  {product.price}
                </Text>
              </YStack>
              <PrimaryButton label="Заказать" href={`/shop/${product.id}`} />
            </YStack>
          </AppCard>
        ))}
      </XStack>
    </Screen>
  );
}
