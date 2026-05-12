import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, InfoGrid, SectionHeader, typography } from '../../src/components/ui';
import { clubs } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ClubsScreen() {
  return (
    <Screen title="Клубы">
      <SectionHeader title="Список клубов" action="рядом" />
      {clubs.map((club) => (
        <Card key={club.id} href={`/clubs/${club.id}`}>
          <XStack alignItems="center" gap={spacing.sm}>
            <IconBadge icon="clubPin" tone="quiet" />
            <Badge label={club.status} tone={club.status === 'Открыто' ? 'green' : 'warning'} />
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {club.name}
          </Text>
          <Text {...typography.body}>{club.address}</Text>
          <InfoGrid
            items={[
              { label: 'Город', value: club.address.split(',')[0] ?? 'Казахстан' },
              { label: 'Столы', value: club.tables },
            ]}
          />
        </Card>
      ))}
    </Screen>
  );
}
