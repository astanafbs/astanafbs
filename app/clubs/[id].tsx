import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { clubs, tournaments } from '../../src/data/mock';
import { spacing } from '../../src/theme';

export default function ClubDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = clubs.find((item) => item.id === id) ?? clubs[0];
  const clubTournaments = tournaments.filter((item) => item.place === club.name);

  return (
    <Screen title="Карточка клуба">
      <Card tone="dark">
        <Badge label={club.status} tone={club.status === 'Открыто' ? 'green' : 'warning'} />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {club.name}
        </Text>
        <Text {...typography.inverseBody}>{club.address}</Text>
      </Card>

      <SectionHeader title="Информация" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Город', value: 'Астана' },
            { label: 'Столы', value: club.tables },
            { label: 'Статус', value: club.status },
            { label: 'Рейтинг', value: '4.8' },
          ]}
        />
      </Card>

      <SectionHeader title="Ближайшие турниры" />
      {(clubTournaments.length ? clubTournaments : tournaments.slice(0, 1)).map((tournament) => (
        <Card key={tournament.id}>
          <Text {...typography.title}>{tournament.title}</Text>
          <Text {...typography.body}>{tournament.fullDate}</Text>
        </Card>
      ))}

      <PrimaryButton label="Позвонить в клуб" />
    </Screen>
  );
}
