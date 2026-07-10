import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'tamagui';

import { Screen } from '../../../../src/components/Screen';
import { YouTubeLivePlayer } from '../../../../src/components/YouTubeLivePlayer';
import { Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../../../src/components/ui';
import { getOptionalMatchStream, getStreamPlayerSource } from '../../../../src/entities/stream/api';
import { getTournament, getTournamentMatches } from '../../../../src/entities/tournament/api';
import { useApiResource } from '../../../../src/shared/lib/useApiResource';

export default function MatchDetailsScreen() {
  const { id, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const tournamentState = useApiResource(() => getTournament(id).then((result) => result.data), [id]);
  const matchesState = useApiResource(() => getTournamentMatches(id).then((result) => result.data), [id, refreshKey]);
  const streamState = useApiResource(() => getOptionalMatchStream(matchId).then((result) => result.data), [matchId, refreshKey]);
  const tournament = tournamentState.data;
  const match = matchesState.data?.find((item) => item.id === matchId) ?? null;
  const stream = streamState.data;

  if (!match) {
    return (
      <Screen title="Матч">
        <Card><Text {...typography.body}>{matchesState.error ?? 'Загружаем матч...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Матч">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{match.player_a_name ?? 'TBD'}</Text>
        <Text {...typography.inverseBody}>vs {match.player_b_name ?? 'TBD'}</Text>
      </Card>

      <SectionHeader title="Трансляция" />
      {stream ? (
        <>
          <YouTubeLivePlayer playerSource={getStreamPlayerSource(stream.id)} title={stream.title} />
          <Card>
            <Text {...typography.title}>{stream.title}</Text>
            <Text {...typography.body}>{stream.status}</Text>
          </Card>
        </>
      ) : (
        <Card>
          <Text {...typography.body}>
            {streamState.loading ? 'Проверяем наличие эфира...' : 'Трансляция этого матча пока не опубликована.'}
          </Text>
        </Card>
      )}

      <SectionHeader title="Онлайн результат" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Турнир', value: tournament?.title ?? '-' },
            { label: 'Матч', value: matchId ?? 'match-1' },
            { label: 'Стол', value: match.table_number ?? '-' },
            { label: 'Счет', value: match.score ?? 'ожидает' },
          ]}
        />
        <PrimaryButton
          label={matchesState.loading || streamState.loading ? 'Обновляем...' : 'Обновить счет'}
          onPress={() => setRefreshKey((value) => value + 1)}
        />
      </Card>
    </Screen>
  );
}
