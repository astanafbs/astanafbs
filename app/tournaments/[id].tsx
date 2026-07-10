import { router, useLocalSearchParams } from 'expo-router';
import { Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, InfoGrid, PrimaryButton, SecondaryButton, SectionHeader, typography } from '../../src/components/ui';
import { getTournament, getTournamentMatches } from '../../src/entities/tournament/api';
import { money, shortDate } from '../../src/shared/lib/format';
import { labelFor, tournamentFormatLabels } from '../../src/shared/lib/labels';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentState = useApiResource(() => getTournament(id).then((result) => result.data), [id]);
  const matchesState = useApiResource(() => getTournamentMatches(id).then((result) => result.data), [id]);
  const tournament = tournamentState.data;

  if (!tournament) {
    return (
      <Screen title="Карточка турнира">
        <Card><Text {...typography.body}>{tournamentState.error ?? 'Загружаем турнир...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Карточка турнира">
      <Card tone="dark">
        <XStack alignItems="center" gap={spacing.sm}>
          <IconBadge icon="tournament" tone="quiet" />
          <Badge label={tournament.status} tone="green" />
        </XStack>
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {tournament.title}
        </Text>
        <Text {...typography.inverseBody}>
          {tournament.club_name ?? tournament.location ?? 'Площадка уточняется'} · {shortDate(tournament.starts_at)}
        </Text>
        <PrimaryButton label="Зарегистрироваться" href={`/tournaments/${tournament.id}/register`} />
      </Card>

      <SectionHeader title="Информация" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Дата', value: shortDate(tournament.starts_at) },
            { label: 'Место', value: tournament.club_name ?? '-' },
            { label: 'Адрес', value: tournament.location ?? '-' },
            { label: 'Дисциплина', value: tournament.discipline },
            { label: 'Формат', value: labelFor(tournamentFormatLabels, tournament.tournament_format) },
            { label: 'Взнос', value: money(tournament.entry_fee_cents, tournament.currency) },
            { label: 'Игроки', value: `${tournament.registrations_count ?? 0}/${tournament.max_players ?? '-'}` },
          ]}
        />
      </Card>

      <SectionHeader title="Турнирная сетка" action="онлайн" />
      <Card>
        {(matchesState.data?.length ? matchesState.data : []).slice(0, 4).map((match) => (
          <Text
            key={match.id}
            color={colors.textSecondary}
            fontSize={14}
            lineHeight={22}
            fontWeight="600"
            paddingVertical={spacing.xs}
          >
            {match.round_name ?? 'Раунд'}: {match.status}
          </Text>
        ))}
        {!matchesState.data?.length ? <Text {...typography.body}>Матчи появятся после создания в админке.</Text> : null}
        <SecondaryButton label="Открыть сетку" href={`/tournaments/${tournament.id}/bracket`} />
      </Card>

      <SectionHeader title="Итоги" />
      <Card>
        {tournament.first_place_name || tournament.second_place_name || tournament.third_place_name ? (
          <InfoGrid
            items={[
              { label: '1 место', value: tournament.first_place_name ?? '-' },
              { label: '2 место', value: tournament.second_place_name ?? '-' },
              { label: '3 место', value: tournament.third_place_name ?? '-' },
              { label: '3 место', value: tournament.third_place_second_name ?? '-' },
            ]}
          />
        ) : (
          <Text {...typography.body}>Победители появятся после публикации итогов организатором.</Text>
        )}
      </Card>

      <SectionHeader title="Онлайн результаты" />
      {(matchesState.data ?? []).slice(0, 3).map((match, index) => (
        <Card key={match.id} href={`/tournaments/${tournament.id}/matches/${match.id}`}>
          <Text {...typography.title}>Стол {match.table_number ?? index + 1}</Text>
          <Text {...typography.meta}>
            {match.score ? `${match.status} · ${match.score}` : match.status}
            {match.has_stream ? ' · эфир доступен' : ''}
          </Text>
        </Card>
      ))}

      <PrimaryButton label="Назад к турнирам" onPress={() => router.back()} />
    </Screen>
  );
}
