import { useLocalSearchParams } from 'expo-router';
import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Avatar, Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { getPlayer } from '../../src/entities/player/api';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: player, error } = useApiResource(() => getPlayer(id).then((result) => result.data), [id]);
  const winPercent = player?.win_percentage ?? 0;

  if (!player) {
    return (
      <Screen title="Игрок">
        <Card><Text {...typography.body}>{error ?? 'Загружаем игрока...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Игрок">
      <Card tone="dark">
        <XStack alignItems="center" gap={spacing.md}>
          <Avatar initials={player.display_name.slice(0, 2).toUpperCase()} />
          <YStack flex={1}>
            <Text {...typography.inverseTitle}>{player.display_name}</Text>
            <Text {...typography.inverseBody}>{player.club_name ?? player.city ?? '-'}</Text>
          </YStack>
        </XStack>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Общий рейтинг', value: player.rating },
            { label: '% побед', value: `${winPercent}%` },
            { label: 'Уровень', value: player.skill_level ?? '-' },
            { label: 'Статус', value: player.profile_status_label ?? '-' },
            { label: 'Звания', value: player.titles?.join(', ') || 'нет' },
            { label: 'Игры', value: player.wins + player.losses },
          ]}
        />
        <PrimaryButton label="Вызвать на дуэль" href={`/modals/challenge-player?opponentId=${player.id}`} />
      </Card>

      <SectionHeader title="История игр" />
      {['Победа 5:3', 'Поражение 2:5', 'Победа 5:4'].map((result) => (
        <Card key={result}>
          <Badge label={result.includes('Победа') ? 'win' : 'loss'} tone={result.includes('Победа') ? 'green' : 'warning'} />
          <Text color={colors.textPrimary} fontSize={15} fontWeight="600" marginTop={spacing.sm}>
            {result}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
