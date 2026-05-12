import { Link } from 'expo-router';
import { Button, Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Avatar, Badge, Card, IconBadge, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { banners, news, players, quickActions, tournaments } from '../../src/data/mock';
import { colors, radius, spacing } from '../../src/theme';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';

export default function HomeScreen() {
  const { user } = useGoogleAuth();

  return (
    <Screen title="Главная" right={<Avatar initials={getInitials(user?.displayName ?? user?.email)} />}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Салам, игрок</Text>
        <Text {...typography.inverseBody}>Готов к следующей партии?</Text>
      </Card>

      <StatRow
        items={[
          { label: 'игроков', value: players.length * 42, icon: 'players' },
          { label: 'турнира', value: tournaments.length, icon: 'tournament' },
          { label: 'клуба', value: 3, icon: 'clubPin' },
        ]}
      />

      <SectionHeader title="Ближайшие события" action="активные" />
      {banners.map((banner) => (
        <Card key={banner.id} tone="green">
          <Badge label={banner.cta} tone="green" />
          <Text {...typography.cardTitle} marginTop={spacing.md}>
            {banner.title}
          </Text>
          <Text {...typography.inverseBody}>{banner.subtitle}</Text>
        </Card>
      ))}

      <SectionHeader title="Быстрая навигация" />
      <XStack flexWrap="wrap" gap={spacing.sm} marginBottom={spacing.md}>
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} asChild>
            <Button
              unstyled
              width="48.5%"
              minHeight={94}
              backgroundColor={colors.cardLight}
              borderRadius={radius.lg}
              borderWidth={1}
              borderColor={colors.line}
              padding={spacing.md}
              justifyContent="space-between"
              alignItems="flex-start"
              pressStyle={{ opacity: 0.82 }}
            >
              <IconBadge icon={action.icon} tone="quiet" />
              <Text color={colors.textPrimary} fontSize={15} fontWeight="700">
                {action.title}
              </Text>
              <Text color={colors.textMuted} fontSize={12} lineHeight={17}>
                {action.subtitle}
              </Text>
            </Button>
          </Link>
        ))}
      </XStack>

      <SectionHeader title="Последние новости" action="все" />
      {news.map((item) => (
        <Card key={item.id}>
          <XStack justifyContent="space-between" alignItems="center" gap={spacing.sm}>
            <Badge label={item.tag} />
            <Text {...typography.meta}>{item.meta}</Text>
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {item.title}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

function getInitials(value?: string | null) {
  if (!value) {
    return 'FA';
  }

  return value
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
