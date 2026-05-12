import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { listings } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = listings.find((item) => item.id === id) ?? listings[0];

  return (
    <Screen title="Объявление">
      <Card tone="dark">
        <Badge label={listing.type} />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {listing.title}
        </Text>
        <Text {...typography.inverseBody}>{listing.price}</Text>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Город', value: 'Астана' },
            { label: 'Состояние', value: 'хорошее' },
            { label: 'Продавец', value: 'профиль BilliardHUB' },
          ]}
        />
        <PrimaryButton label="Написать продавцу" />
      </Card>
    </Screen>
  );
}
