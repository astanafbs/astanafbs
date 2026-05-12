import { Link } from 'expo-router';
import { Button, Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, InfoGrid, SectionHeader, typography } from '../../src/components/ui';
import { tournaments } from '../../src/data/mock';
import { colors, radius, spacing } from '../../src/theme';

export default function TournamentsScreen() {
  return (
    <Screen title="Турниры">
      <XStack backgroundColor={colors.cardDark} borderRadius={radius.md} padding={4} marginBottom={spacing.md}>
        {['Активные', 'Скоро', 'Архив'].map((label, index) => (
          <Text
            key={label}
            flex={1}
            borderRadius={radius.sm}
            backgroundColor={index === 0 ? colors.cardElevated : 'transparent'}
            color={index === 0 ? colors.textPrimary : colors.textSecondary}
            fontSize={13}
            fontWeight="600"
            paddingVertical={10}
            textAlign="center"
            overflow="hidden"
          >
            {label}
          </Text>
        ))}
      </XStack>

      <SectionHeader title="Список турниров" action="фильтры" />
      {tournaments.map((tournament) => (
        <Card key={tournament.id}>
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap={spacing.sm}>
              <IconBadge icon="tournament" tone="quiet" />
              <Badge
                label={tournament.status}
                tone={tournament.status.includes('открыта') ? 'green' : 'neutral'}
              />
            </XStack>
            <Text {...typography.meta}>{tournament.date}</Text>
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {tournament.title}
          </Text>
          <InfoGrid
            items={[
              { label: 'Место', value: tournament.place },
              { label: 'Взнос', value: tournament.fee },
              { label: 'Игроки', value: `${tournament.players}/${tournament.maxPlayers}` },
              { label: 'Призовой', value: tournament.prize },
            ]}
          />
          <Link href={`/tournaments/${tournament.id}`} asChild>
            <Button
              unstyled
              height={48}
              borderRadius={radius.md}
              backgroundColor={colors.brass500}
              alignItems="center"
              justifyContent="center"
              marginTop={spacing.sm}
              pressStyle={{ opacity: 0.82 }}
            >
              <Text color={colors.rail900} fontSize={15} fontWeight="700">
                Открыть турнир
              </Text>
            </Button>
          </Link>
        </Card>
      ))}
    </Screen>
  );
}
