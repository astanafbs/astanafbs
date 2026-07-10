import { useMemo, useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, EmptyPanel, InfoGrid, SectionHeader, typography } from '../../src/components/ui';
import {
  createClubTournament,
  generateClubTournamentBracket,
  getClubAdminOverview,
  updateClubMatch,
  updateClubRegistration,
  upsertClubMatchStream,
} from '../../src/entities/club-admin/api';
import { getMe, hasActiveEntitlement } from '../../src/entities/me/api';
import { shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const bracketSizes = [16, 32, 64] as const;

export default function ClubAdminScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [bracketSize, setBracketSize] = useState<(typeof bracketSizes)[number]>(16);
  const [scoreByMatch, setScoreByMatch] = useState<Record<string, string>>({});
  const [tableByMatch, setTableByMatch] = useState<Record<string, string>>({});

  const meState = useApiResource(() => getMe(), [refreshKey]);
  const overviewState = useApiResource(() => getClubAdminOverview().then((result) => result.data), [refreshKey]);
  const overview = overviewState.data;
  const club = overview?.clubs[0] ?? null;
  const canManageClub = hasActiveEntitlement(meState.data, 'club_admin') && Boolean(meState.data?.clubMemberships.length);
  const pendingRegistrations = overview?.registrations.filter((registration) => registration.status === 'pending') ?? [];
  const activeMatches = overview?.matches.filter((match) => match.status !== 'cancelled') ?? [];

  const playersByMatch = useMemo(() => {
    const result = new Map<string, Array<{ id: string; name: string }>>();
    activeMatches.forEach((match) => {
      const players = [
        match.player_a_id ? { id: match.player_a_id, name: match.player_a_name ?? 'Игрок A' } : null,
        match.player_b_id ? { id: match.player_b_id, name: match.player_b_name ?? 'Игрок B' } : null,
      ].filter(Boolean) as Array<{ id: string; name: string }>;
      result.set(match.id, players);
    });
    return result;
  }, [activeMatches]);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setMessage(null);
    try {
      await action();
      setMessage(success);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось выполнить действие');
    }
  }

  function handleCreateTournament() {
    if (!club || !title.trim()) return;
    return runAction(
      () => createClubTournament({
        clubId: club.club_id,
        title: title.trim(),
        status: 'registration_open',
        maxPlayers: bracketSize,
      }),
      'Турнир создан',
    ).then(() => setTitle(''));
  }

  if (meState.loading || overviewState.loading) {
    return <Screen title="Мой клуб"><EmptyPanel title="Загружаем доступы" /></Screen>;
  }

  if (!canManageClub || overviewState.error) {
    return (
      <Screen title="Мой клуб">
        <EmptyPanel
          title="Нет доступа администратора клуба"
          body={overviewState.error ?? 'Суперадмин должен выдать роль, клуб и активный доступ club_admin.'}
        />
      </Screen>
    );
  }

  return (
    <Screen title="Мой клуб">
      {message ? <Card><Text {...typography.title}>{message}</Text></Card> : null}

      <Card tone="dark">
        <Text {...typography.inverseTitle}>{club?.club_name ?? 'Клуб'}</Text>
        <Text {...typography.inverseBody}>{club?.club_city ?? 'Казахстан'} · управление турнирами, столами, счетом и эфирами</Text>
      </Card>

      <SectionHeader title="Новый турнир" />
      <Card>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Название турнира"
          color={colors.textPrimary}
          backgroundColor={colors.chipDark}
          borderWidth={0}
        />
        <XStack gap={spacing.sm} marginTop={spacing.md}>
          {bracketSizes.map((size) => (
            <Button
              key={size}
              unstyled
              flex={1}
              minHeight={42}
              borderRadius={radius.md}
              backgroundColor={bracketSize === size ? colors.brass500 : colors.chipDark}
              alignItems="center"
              justifyContent="center"
              onPress={() => setBracketSize(size)}
            >
              <Text color={bracketSize === size ? colors.rail900 : colors.textPrimary} fontWeight="700">
                {size}
              </Text>
            </Button>
          ))}
        </XStack>
        <Button
          unstyled
          minHeight={48}
          borderRadius={radius.md}
          backgroundColor={colors.brass500}
          alignItems="center"
          justifyContent="center"
          marginTop={spacing.md}
          onPress={handleCreateTournament}
        >
          <Text color={colors.rail900} fontWeight="700">Создать турнир</Text>
        </Button>
      </Card>

      <SectionHeader title="Турниры" action={`${overview?.tournaments.length ?? 0}`} />
      {overview?.tournaments.map((tournament) => (
        <Card key={tournament.id}>
          <XStack justifyContent="space-between" gap={spacing.sm}>
            <YStack flex={1}>
              <Text {...typography.title}>{tournament.title}</Text>
              <Text {...typography.meta}>{shortDate(tournament.starts_at)} · сетка {tournament.max_players ?? 16}</Text>
            </YStack>
            <Badge label={tournament.status} tone="warning" />
          </XStack>
          <InfoGrid items={[
            { label: 'Заявки', value: tournament.registrations_count ?? 0 },
            { label: 'Дисциплина', value: tournament.discipline },
          ]} />
          <Button
            unstyled
            minHeight={44}
            borderRadius={radius.md}
            backgroundColor={colors.chipDark}
            alignItems="center"
            justifyContent="center"
            onPress={() => runAction(() => generateClubTournamentBracket(tournament.id), 'Сетка сгенерирована')}
          >
            <Text color={colors.textPrimary} fontWeight="700">Сгенерировать сетку</Text>
          </Button>
        </Card>
      ))}

      <SectionHeader title="Заявки" action={`${pendingRegistrations.length} новых`} />
      {overview?.registrations.map((registration) => (
        <Card key={registration.id}>
          <Text {...typography.title}>{registration.user_name}</Text>
          <Text {...typography.meta}>{registration.tournament_title} · рейтинг {registration.rating ?? 0}</Text>
          <XStack gap={spacing.sm} marginTop={spacing.md}>
            <Button
              unstyled
              flex={1}
              minHeight={42}
              borderRadius={radius.md}
              backgroundColor={colors.brass500}
              alignItems="center"
              justifyContent="center"
              onPress={() => runAction(() => updateClubRegistration(registration.id, { status: 'confirmed' }), 'Заявка подтверждена')}
            >
              <Text color={colors.rail900} fontWeight="700">Подтвердить</Text>
            </Button>
            <Button
              unstyled
              flex={1}
              minHeight={42}
              borderRadius={radius.md}
              backgroundColor={colors.chipDark}
              alignItems="center"
              justifyContent="center"
              onPress={() => runAction(() => updateClubRegistration(registration.id, { status: 'rejected' }), 'Заявка отклонена')}
            >
              <Text color={colors.textPrimary} fontWeight="700">Отклонить</Text>
            </Button>
          </XStack>
        </Card>
      ))}

      <SectionHeader title="Матчи и столы" action={`${activeMatches.length}`} />
      {activeMatches.map((match) => (
        <Card key={match.id}>
          <XStack justifyContent="space-between" gap={spacing.sm}>
            <YStack flex={1}>
              <Text {...typography.title}>{match.player_a_name ?? 'TBD'} vs {match.player_b_name ?? 'TBD'}</Text>
              <Text {...typography.meta}>{match.tournament_title ?? match.round_name ?? 'Матч'} · стол {match.table_number ?? '-'}</Text>
            </YStack>
            <Badge label={match.status} />
          </XStack>
          <XStack gap={spacing.sm} marginTop={spacing.md}>
            <Input
              flex={1}
              value={scoreByMatch[match.id] ?? match.score ?? ''}
              onChangeText={(value) => setScoreByMatch((state) => ({ ...state, [match.id]: value }))}
              placeholder="Счет"
              color={colors.textPrimary}
              backgroundColor={colors.chipDark}
              borderWidth={0}
            />
            <Input
              width={92}
              value={tableByMatch[match.id] ?? String(match.table_number ?? '')}
              onChangeText={(value) => setTableByMatch((state) => ({ ...state, [match.id]: value }))}
              placeholder="Стол"
              keyboardType="number-pad"
              color={colors.textPrimary}
              backgroundColor={colors.chipDark}
              borderWidth={0}
            />
          </XStack>
          <XStack gap={spacing.sm} marginTop={spacing.sm}>
            {(playersByMatch.get(match.id) ?? []).map((player) => (
              <Button
                key={player.id}
                unstyled
                flex={1}
                minHeight={40}
                borderRadius={radius.md}
                backgroundColor={colors.chipDark}
                alignItems="center"
                justifyContent="center"
                onPress={() => runAction(
                  () => updateClubMatch(match.id, {
                    score: scoreByMatch[match.id] ?? match.score ?? null,
                    tableNumber: Number(tableByMatch[match.id] ?? match.table_number) || null,
                    winnerId: player.id,
                    status: 'completed',
                  }),
                  'Матч завершен',
                )}
              >
                <Text color={colors.textPrimary} fontWeight="700" numberOfLines={1}>{player.name}</Text>
              </Button>
            ))}
          </XStack>
          {match.stream_id ? (
            <Text {...typography.meta} marginTop={spacing.sm}>
              Трансляция: {match.stream_has_video ? 'готова к просмотру' : 'ожидает Video ID от суперадмина'}
            </Text>
          ) : null}
          <Button
            unstyled
            minHeight={42}
            borderRadius={radius.md}
            backgroundColor={colors.chipDark}
            alignItems="center"
            justifyContent="center"
            marginTop={spacing.sm}
            onPress={() => runAction(
              () => upsertClubMatchStream(match.id, {
                status: match.stream_has_video ? 'published' : 'draft',
              }),
              match.stream_has_video ? 'Трансляция опубликована' : 'Запрос на трансляцию сохранен',
            )}
          >
            <Text color={colors.textPrimary} fontWeight="700">
              {match.stream_has_video ? 'Опубликовать трансляцию' : 'Запросить трансляцию'}
            </Text>
          </Button>
        </Card>
      ))}
    </Screen>
  );
}
