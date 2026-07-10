import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { TournamentBracketCanvas } from '../../../src/components/TournamentBracketCanvas';
import { Badge, Card, SectionHeader, typography } from '../../../src/components/ui';
import { getTournament, getTournamentMatches } from '../../../src/entities/tournament/api';
import { labelFor, tournamentFormatLabels } from '../../../src/shared/lib/labels';
import { useApiResource } from '../../../src/shared/lib/useApiResource';
import { spacing } from '../../../src/theme';

export default function TournamentBracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentState = useApiResource(() => getTournament(id).then((result) => result.data), [id]);
  const matchesState = useApiResource(() => getTournamentMatches(id).then((result) => result.data), [id]);
  const tournament = tournamentState.data;

  return (
    <Screen title="Сетка">
      <Card tone="dark">
        <Badge label={labelFor(tournamentFormatLabels, tournament?.tournament_format)} tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {tournament?.title ?? 'Турнир'}
        </Text>
      </Card>

      <SectionHeader title={tournament?.tournament_format === 'single_elimination' ? 'Турнирная сетка' : 'Туры и пары'} />
      <Card>
        {matchesState.error ? <Text {...typography.body}>{matchesState.error}</Text> : null}
        <TournamentBracketCanvas matches={matchesState.data ?? []} tournamentFormat={tournament?.tournament_format} />
      </Card>
    </Screen>
  );
}
