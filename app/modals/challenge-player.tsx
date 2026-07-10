import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { getClubs } from '../../src/entities/club/api';
import { getMe } from '../../src/entities/me/api';
import { getRatings } from '../../src/entities/player/api';
import type { PlayerProfile } from '../../src/entities/player/types';
import { submitDuelChallenge } from '../../src/features/duel-create/api';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const dateOptions = [
  { key: 'tomorrow', label: 'Завтра', days: 1 },
  { key: 'three-days', label: 'Через 3 дня', days: 3 },
  { key: 'week', label: 'Через неделю', days: 7 },
  { key: 'later', label: 'Дату согласуем позже', days: null },
] as const;

type DateOptionKey = (typeof dateOptions)[number]['key'];

export default function ChallengePlayerModal() {
  const { opponentId } = useLocalSearchParams<{ opponentId?: string }>();
  const meState = useApiResource(() => getMe());
  const playersState = useApiResource(() => getRatings().then((result) => result.data));
  const clubsState = useApiResource(() => getClubs().then((result) => result.data));
  const [selectedOpponentId, setSelectedOpponentId] = useState(opponentId ?? '');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [dateOption, setDateOption] = useState<DateOptionKey>('tomorrow');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const currentUserId = meState.data?.user.id;
  const opponents = (playersState.data ?? []).filter((player) => player.id !== currentUserId);
  const selectedOpponent = opponents.find((player) => player.id === selectedOpponentId);
  const selectedClub = (clubsState.data ?? []).find((club) => club.id === selectedClubId);

  async function handleSubmit() {
    if (!selectedOpponentId || submitting) return;

    const selectedDate = dateOptions.find((option) => option.key === dateOption);
    const scheduledAt = selectedDate?.days == null
      ? undefined
      : new Date(Date.now() + selectedDate.days * 24 * 60 * 60 * 1000).toISOString();

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitDuelChallenge({
        opponentId: selectedOpponentId,
        clubId: selectedClubId || undefined,
        scheduledAt,
      });
      setCreated(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать дуэль');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Вызов игрока">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Новая дуэль</Text>
        <Text {...typography.inverseBody}>
          Выберите соперника, площадку и удобный ориентир по времени. После создания дуэль появится в общем списке.
        </Text>
      </Card>

      <SectionHeader title="Соперник" action={selectedOpponent?.display_name ?? 'не выбран'} />
      <Card>
        {playersState.loading ? <Text {...typography.body}>Загружаем игроков...</Text> : null}
        {playersState.error ? <Text {...typography.body}>{playersState.error}</Text> : null}
        <YStack gap={spacing.sm}>
          {opponents.map((player) => (
            <PlayerOption
              key={player.id}
              player={player}
              active={selectedOpponentId === player.id}
              onPress={() => {
                setSelectedOpponentId(player.id);
                setCreated(false);
              }}
            />
          ))}
        </YStack>
      </Card>

      <SectionHeader title="Клуб" action={selectedClub?.name ?? 'можно без клуба'} />
      <Card>
        <XStack flexWrap="wrap" gap={spacing.sm}>
          <OptionChip
            label="Без клуба"
            active={!selectedClubId}
            onPress={() => {
              setSelectedClubId('');
              setCreated(false);
            }}
          />
          {(clubsState.data ?? []).map((club) => (
            <OptionChip
              key={club.id}
              label={club.name}
              active={selectedClubId === club.id}
              onPress={() => {
                setSelectedClubId(club.id);
                setCreated(false);
              }}
            />
          ))}
        </XStack>
        {clubsState.error ? <Text {...typography.meta} marginTop={spacing.md}>{clubsState.error}</Text> : null}
      </Card>

      <SectionHeader title="Дата" action={dateOptions.find((option) => option.key === dateOption)?.label} />
      <Card>
        <XStack flexWrap="wrap" gap={spacing.sm}>
          {dateOptions.map((option) => (
            <OptionChip
              key={option.key}
              label={option.label}
              active={dateOption === option.key}
              onPress={() => {
                setDateOption(option.key);
                setCreated(false);
              }}
            />
          ))}
        </XStack>
      </Card>

      <Card>
        <Text {...typography.title}>Проверка</Text>
        <Text {...typography.body}>
          {selectedOpponent
            ? `${selectedOpponent.display_name}${selectedClub ? ` · ${selectedClub.name}` : ''}`
            : 'Сначала выберите соперника.'}
        </Text>
        {submitError ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {submitError}
          </Text>
        ) : null}
        {created ? (
          <Text color={colors.success500} fontSize={13} fontWeight="700" marginTop={spacing.md}>
            Дуэль создана и ожидает ответа соперника.
          </Text>
        ) : null}
        {created ? (
          <Link href="/duels" asChild>
            <Button
              unstyled
              minHeight={48}
              borderRadius={radius.md}
              backgroundColor={colors.chipDark}
              borderWidth={1}
              borderColor={colors.borderSoft}
              alignItems="center"
              justifyContent="center"
              marginTop={spacing.md}
              pressStyle={{ opacity: 0.82 }}
            >
              <Text color={colors.textPrimary} fontSize={15} fontWeight="700">
                К дуэлям
              </Text>
            </Button>
          </Link>
        ) : (
          <Button
            unstyled
            minHeight={48}
            borderRadius={radius.md}
            backgroundColor={selectedOpponentId ? colors.brass500 : colors.chipDark}
            alignItems="center"
            justifyContent="center"
            marginTop={spacing.md}
            disabled={!selectedOpponentId || submitting}
            opacity={!selectedOpponentId ? 0.7 : 1}
            onPress={handleSubmit}
            pressStyle={{ opacity: 0.82 }}
          >
            <Text color={selectedOpponentId ? colors.rail900 : colors.textMuted} fontSize={15} fontWeight="700">
              {submitting ? 'Создаем...' : 'Создать дуэль'}
            </Text>
          </Button>
        )}
      </Card>
    </Screen>
  );
}

function PlayerOption({
  player,
  active,
  onPress,
}: {
  player: PlayerProfile;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      unstyled
      borderRadius={radius.md}
      backgroundColor={active ? colors.brass500 : colors.chipDark}
      borderWidth={active ? 0 : 1}
      borderColor={colors.borderSoft}
      padding={spacing.md}
      alignItems="stretch"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: active ? 0 : 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
    >
      <XStack justifyContent="space-between" alignItems="center" gap={spacing.md}>
        <YStack flex={1}>
          <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={15} fontWeight="700">
            {player.display_name}
          </Text>
          <Text color={active ? colors.rail900 : colors.textMuted} fontSize={12} marginTop={3}>
            {[player.city, player.club_name].filter(Boolean).join(' · ') || 'игрок'}
          </Text>
        </YStack>
        <Text color={active ? colors.rail900 : colors.brass400} fontSize={14} fontWeight="800">
          {player.rating}
        </Text>
      </XStack>
    </Button>
  );
}

function OptionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      unstyled
      borderRadius={radius.full}
      backgroundColor={active ? colors.brass500 : colors.chipDark}
      borderWidth={active ? 0 : 1}
      borderColor={colors.borderSoft}
      minHeight={36}
      paddingHorizontal={spacing.md}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: active ? 0 : 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
    >
      <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="700">
        {label}
      </Text>
    </Button>
  );
}
