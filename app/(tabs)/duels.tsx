import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, PrimaryButton, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { getDuels } from '../../src/entities/duel/api';
import { useI18n } from '../../src/shared/lib/i18n';
import type { TranslationKey } from '../../src/shared/lib/i18n';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

type DuelRow = {
  id: string;
  challenger_name?: string | null;
  opponent_name?: string | null;
  score?: string | null;
  status: string;
};

export default function DuelsScreen() {
  const { t } = useI18n();
  const { data, loading, error } = useApiResource(() => getDuels().then((result) => result.data as unknown as DuelRow[]));
  const duels = data ?? [];
  const activeDuels = duels.filter((duel) => ['pending', 'accepted', 'scheduled', 'live'].includes(duel.status)).length;
  const completedDuels = duels.filter((duel) => duel.status === 'completed').length;

  return (
    <Screen title={t('duels.title')}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{t('duels.challenge')}</Text>
        <Text {...typography.inverseBody}>{t('duels.description')}</Text>
        <PrimaryButton label={t('duels.create')} href="/modals/challenge-player" />
      </Card>

      <StatRow
        items={[
          { label: t('duels.active'), value: activeDuels, icon: 'match' },
          { label: t('duels.played'), value: completedDuels, icon: 'match' },
          { label: t('duels.total'), value: duels.length, icon: 'ratingList' },
        ]}
      />

      <SectionHeader title={t('duels.history')} action={t('duels.all')} />
      {loading ? <Card><Text {...typography.body}>{t('duels.loading')}</Text></Card> : null}
      {error ? <Card><Text {...typography.body}>{error}</Text></Card> : null}
      {duels.map((duel) => (
        <DuelMatchCard key={duel.id} duel={duel} />
      ))}

      <Card>
        <Text {...typography.title}>{t('duels.rulesTitle')}</Text>
        <YStack marginTop={spacing.md} gap={spacing.sm}>
          {(['duels.rule1', 'duels.rule2', 'duels.rule3'] as TranslationKey[]).map((rule) => (
            <Text
              key={rule}
              backgroundColor={colors.chipDark}
              borderWidth={1}
              borderColor={colors.borderSoft}
              borderRadius={radius.md}
              color={colors.textSecondary}
              fontSize={14}
              lineHeight={20}
              padding={spacing.md}
            >
              {t(rule)}
            </Text>
          ))}
        </YStack>
      </Card>
    </Screen>
  );
}

function DuelMatchCard({ duel }: { duel: DuelRow }) {
  const { t } = useI18n();
  const leftPlayer = duel.challenger_name ?? t('duels.player');
  const rightPlayer = duel.opponent_name ?? t('duels.opponent');
  const statusLabel = getDuelStatusLabel(duel.status, t);

  return (
    <Card>
      <XStack alignItems="center" justifyContent="space-between" gap={spacing.sm}>
        <Badge label={statusLabel} tone={duel.status === 'completed' ? 'green' : 'warning'} />
        <Text color={colors.textMuted} fontSize={12}>
          {t('duels.duel')}
        </Text>
      </XStack>

      <XStack alignItems="flex-start" justifyContent="space-between" gap={spacing.sm} marginTop={spacing.md}>
        <PlayerSide name={leftPlayer} align="left" />
        <YStack width={86} alignItems="center" gap={spacing.xs}>
          <XStack width="100%" justifyContent="center">
            <IconBadge icon="match" tone="accent" />
          </XStack>
          <Text color={colors.textPrimary} fontSize={18} fontWeight="700">
            {duel.score ?? t('duels.waiting')}
          </Text>
          <Text color={colors.textMuted} fontSize={11} fontWeight="600" textAlign="center">
            {t('duels.score')}
          </Text>
        </YStack>
        <PlayerSide name={rightPlayer} align="right" />
      </XStack>
    </Card>
  );
}

function getDuelStatusLabel(status: string, t: (key: TranslationKey) => string) {
  const key = `duels.status.${status}` as TranslationKey;
  const label = t(key);
  return label === key ? status : label;
}

function PlayerSide({ name, align }: { name: string; align: 'left' | 'right' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <YStack flex={1} alignItems={align === 'left' ? 'flex-start' : 'flex-end'} gap={spacing.sm}>
      <XStack width="100%" justifyContent={align === 'left' ? 'flex-start' : 'flex-end'}>
        <IconBadge icon={initials || 'P'} tone="quiet" />
      </XStack>
      <Text
        color={colors.textPrimary}
        fontSize={15}
        lineHeight={19}
        fontWeight="600"
        textAlign={align === 'left' ? 'left' : 'right'}
      >
        {name}
      </Text>
    </YStack>
  );
}
