import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { listings } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ListingsScreen() {
  return (
    <Screen title="Объявления">
      <SectionHeader title="Свежие объявления" />
      {listings.map((listing) => (
        <Card key={listing.id} href={`/listings/${listing.id}`}>
          <XStack alignItems="center" gap={spacing.sm}>
            <IconBadge icon={listing.type === 'Продажа' ? 'price' : 'listing'} tone="quiet" />
            <Badge label={listing.type} />
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {listing.title}
          </Text>
          <Text {...typography.body}>{listing.price}</Text>
        </Card>
      ))}
      <PrimaryButton label="Разместить объявление" href="/listings/create" />
    </Screen>
  );
}
