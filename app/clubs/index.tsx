import { Image } from 'react-native';
import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, EmptyPanel, IconBadge, InfoGrid, SectionHeader, typography } from '../../src/components/ui';
import { getClubs } from '../../src/entities/club/api';
import { imageUri } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { spacing } from '../../src/theme';

export default function ClubsScreen() {
  const { data: clubs, error, loading } = useApiResource(() => getClubs().then((result) => result.data));

  return (
    <Screen title="Клубы">
      <SectionHeader title="Список клубов" action={`${clubs?.length ?? 0} площадок`} />
      {loading ? (
        <EmptyPanel title="Загружаем клубы" body="Список площадок приходит из админки." />
      ) : null}
      {error ? (
        <EmptyPanel title="API недоступен" body={error} />
      ) : null}
      {(clubs ?? []).map((club) => {
        const uri = imageUri(club.image_key);
        return (
        <Card key={club.id} href={`/clubs/${club.id}`}>
          <XStack alignItems="center" gap={spacing.sm}>
            <IconBadge icon="clubPin" tone="quiet" />
            <Badge label="Открыто" tone="green" />
          </XStack>
          {uri ? (
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{
                width: '100%',
                height: 150,
                borderRadius: 16,
                marginTop: spacing.md,
              }}
            />
          ) : null}
          <Text {...typography.title} marginTop={spacing.md}>
            {club.name}
          </Text>
          <Text {...typography.body}>{club.address}</Text>
          <InfoGrid
            items={[
              { label: 'Город', value: club.city },
              { label: '2ГИС', value: club.two_gis_url ? 'есть' : 'нет' },
            ]}
          />
        </Card>
      );})}
    </Screen>
  );
}
