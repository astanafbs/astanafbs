import { Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, IconBadge, PrimaryButton, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { duels } from '../../src/data/mock';
import { colors, radius, spacing } from '../../src/theme';

export default function DuelsScreen() {
  return (
    <Screen title="Дуэли">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Вызов игрока</Text>
        <Text {...typography.inverseBody}>
          Создайте дуэль, подтвердите матч и получите отдельный рейтинг.
        </Text>
        <PrimaryButton label="Создать вызов" />
      </Card>

      <StatRow
        items={[
          { label: 'активные', value: 4, icon: 'battleCueBalls' },
          { label: 'сыграно', value: 28, icon: 'match' },
          { label: 'мой рейтинг', value: 920, icon: 'ratingList' },
        ]}
      />

      <SectionHeader title="История игр" action="все дуэли" />
      {duels.map((duel) => (
        <DuelMatchCard key={duel.id} duel={duel} />
      ))}

      <Card>
        <Text {...typography.title}>Правила V1</Text>
        <YStack marginTop={spacing.md} gap={spacing.sm}>
          {[
            'Вызов можно отправить любому игроку',
            'Результат подтверждают оба участника',
            'Спорные игры уходят в админ-модерацию',
          ].map((rule) => (
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
              {rule}
            </Text>
          ))}
        </YStack>
      </Card>
    </Screen>
  );
}

function DuelMatchCard({ duel }: { duel: (typeof duels)[number] }) {
  const [leftPlayer, rightPlayer = 'Соперник'] = duel.title.split(' против ');

  return (
    <Card>
      <XStack alignItems="center" justifyContent="space-between" gap={spacing.sm}>
        <Badge label={duel.status} tone={duel.status === 'Завершено' ? 'green' : 'warning'} />
        <Text color={colors.textMuted} fontSize={12}>
          дуэль
        </Text>
      </XStack>

      <XStack alignItems="center" justifyContent="space-between" gap={spacing.sm} marginTop={spacing.md}>
        <PlayerSide name={leftPlayer} align="left" />
        <YStack alignItems="center" gap={spacing.xs}>
          <IconBadge icon="battleCueBalls" tone="accent" />
          <Text color={colors.textPrimary} fontSize={18} fontWeight="700">
            {duel.score}
          </Text>
        </YStack>
        <PlayerSide name={rightPlayer} align="right" />
      </XStack>
    </Card>
  );
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
      <IconBadge icon={initials || 'P'} tone="quiet" />
      <Text
        color={colors.textPrimary}
        fontSize={15}
        lineHeight={19}
        fontWeight="700"
        textAlign={align === 'left' ? 'left' : 'right'}
      >
        {name}
      </Text>
    </YStack>
  );
}
