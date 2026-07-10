import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, EmptyPanel, IconBadge, SectionHeader, typography } from '../../src/components/ui';
import { getTournaments } from '../../src/entities/tournament/api';
import { money, shortDate } from '../../src/shared/lib/format';
import { useI18n } from '../../src/shared/lib/i18n';
import { labelFor, tournamentFormatLabels, tournamentStatusLabels } from '../../src/shared/lib/labels';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const tournamentTabs = [
  { label: 'tournaments.active', value: 'active' },
  { label: 'tournaments.upcoming', value: 'upcoming' },
  { label: 'tournaments.archive', value: 'archive' },
] as const;

type TournamentTab = (typeof tournamentTabs)[number]['value'];

export default function TournamentsScreen() {
  const { t } = useI18n();
  const { tab: routeTab } = useLocalSearchParams<{ tab?: string }>();
  const { data: tournaments, loading, error } = useApiResource(() => getTournaments().then((result) => result.data));
  const initialTab = tournamentTabs.some((item) => item.value === routeTab) ? routeTab as TournamentTab : 'active';
  const [tab, setTab] = useState<TournamentTab>(initialTab);

  useEffect(() => {
    if (tournamentTabs.some((item) => item.value === routeTab)) {
      setTab(routeTab as TournamentTab);
    }
  }, [routeTab]);
  const list = useMemo(() => {
    const source = tournaments ?? [];
    if (tab === 'archive') return source.filter((tournament) => tournament.status === 'completed');
    if (tab === 'upcoming') return source.filter((tournament) => tournament.status === 'registration_open');
    return source.filter((tournament) => ['registration_open', 'registration_closed', 'in_progress'].includes(tournament.status));
  }, [tab, tournaments]);

  return (
    <Screen title={t('tournaments.title')}>
      <XStack backgroundColor={colors.cardDark} borderRadius={radius.md} padding={4} marginBottom={spacing.md}>
        {tournamentTabs.map((item) => {
          const active = item.value === tab;
          return (
          <Button
            key={item.value}
            unstyled
            flex={1}
            borderRadius={radius.sm}
            backgroundColor={active ? colors.cardElevated : 'transparent'}
            borderWidth={0}
            alignItems="center"
            justifyContent="center"
            minHeight={40}
            onPress={() => setTab(item.value)}
            pressStyle={{ opacity: 0.82 }}
            overflow="hidden"
          >
            <Text color={active ? colors.textPrimary : colors.textSecondary} fontSize={13} fontWeight="600">
              {t(item.label)}
            </Text>
          </Button>
          );
        })}
      </XStack>

      <SectionHeader title={t('tournaments.list')} action={t('tournaments.eventsCount', { count: list.length })} />
      {loading ? <EmptyPanel title={t('tournaments.loading')} body={t('tournaments.loadingBody')} /> : null}
      {error ? <EmptyPanel title={t('tournaments.apiUnavailable')} body={error} /> : null}
      {!loading && !error && list.length === 0 ? (
        <EmptyPanel title={t('tournaments.emptyTitle')} body={t('tournaments.emptyBody')} />
      ) : null}
      {list.map((tournament) => (
        <Card key={tournament.id}>
          <XStack gap={spacing.md} alignItems="stretch">
            <YStack
              width={70}
              borderRadius={radius.md}
              backgroundColor={colors.chipDark}
              borderWidth={1}
              borderColor={colors.borderSoft}
              alignItems="center"
              justifyContent="center"
              padding={spacing.sm}
            >
              <IconBadge icon="calendar" tone="accent" />
              <Text color={colors.textPrimary} fontSize={12} fontWeight="800" marginTop={spacing.xs} textAlign="center">
                {shortDate(tournament.starts_at).split(',')[0]}
              </Text>
            </YStack>
            <YStack flex={1} gap={spacing.sm}>
              <XStack alignItems="center" justifyContent="space-between" gap={spacing.sm}>
                <Badge
                  label={labelFor(tournamentStatusLabels, tournament.status)}
                  tone={tournament.status === 'registration_open' ? 'green' : 'neutral'}
                />
                <Text {...typography.meta}>{labelFor(tournamentFormatLabels, tournament.tournament_format)}</Text>
              </XStack>
              <Text {...typography.title}>{tournament.title}</Text>
              <Text {...typography.body} marginTop={0}>
                {[tournament.club_name, tournament.club_city].filter(Boolean).join(', ') || tournament.location || '-'}
              </Text>
              <XStack justifyContent="space-between" gap={spacing.sm}>
                <Text color={colors.brass400} fontSize={13} fontWeight="700">
                  {money(tournament.entry_fee_cents, tournament.currency)}
                </Text>
                <Text {...typography.meta}>
                  {t('tournaments.playersCount', {
                    current: tournament.registrations_count ?? 0,
                    max: tournament.max_players ?? '-',
                  })}
                </Text>
              </XStack>
            </YStack>
          </XStack>
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
                {t('tournaments.open')}
              </Text>
            </Button>
          </Link>
        </Card>
      ))}
    </Screen>
  );
}
