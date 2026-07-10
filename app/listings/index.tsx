import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { AppCard, Badge, EmptyPanel, IconBadge, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { getListings } from '../../src/entities/listing/api';
import { money } from '../../src/shared/lib/format';
import { contentStatusLabels, labelFor, listingCategoryLabels } from '../../src/shared/lib/labels';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const categories = [
  ['all', 'Все'],
  ['coaches', 'Тренера'],
  ['cues', 'Кии'],
  ['chalk', 'Мелки'],
  ['cases', 'Чехлы'],
  ['tables', 'Столы'],
  ['misc', 'Разное'],
];

export default function ListingsScreen() {
  const [category, setCategory] = useState('all');
  const { data: listings, loading, error } = useApiResource(() => getListings().then((result) => result.data));
  const visibleListings = category === 'all'
    ? (listings ?? [])
    : (listings ?? []).filter((listing) => listing.category === category);

  return (
    <Screen title="Объявления">
      <SectionHeader title="Категории" />
      <XStack flexWrap="wrap" gap={spacing.sm} marginBottom={spacing.md}>
        {categories.map(([value, label]) => {
          const active = value === category;
          return (
            <Button
              key={value}
              unstyled
              borderRadius={radius.full}
              backgroundColor={active ? colors.brass500 : colors.chipDark}
              borderWidth={1}
              borderColor={active ? colors.brass500 : colors.borderSoft}
              paddingHorizontal={spacing.md}
              minHeight={38}
              alignItems="center"
              justifyContent="center"
              onPress={() => setCategory(value)}
              pressStyle={{ opacity: 0.82 }}
            >
              <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="700">
                {label}
              </Text>
            </Button>
          );
        })}
      </XStack>

      <SectionHeader title="Свежие объявления" action={`${visibleListings.length} шт.`} />
      {loading ? <EmptyPanel title="Загружаем объявления" body="Берем опубликованные позиции из backend." /> : null}
      {error ? <EmptyPanel title="API недоступен" body={error} /> : null}
      <XStack flexWrap="wrap" gap={spacing.sm}>
        {visibleListings.map((listing) => (
          <Link key={listing.id} href={`/listings/${listing.id}`} asChild>
            <AppCard
              width="48.5%"
              minHeight={210}
              padding={spacing.md}
              marginBottom={0}
              pressStyle={{ opacity: 0.9 }}
            >
              <YStack flex={1} justifyContent="space-between">
                <YStack gap={spacing.sm}>
                  <YStack
                    height={78}
                    borderRadius={radius.md}
                    backgroundColor={colors.cardDark}
                    borderWidth={1}
                    borderColor={colors.borderSoft}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconBadge icon={listing.category === 'coaches' ? 'profileUser' : 'product'} tone="accent" />
                  </YStack>
                  <Badge
                    label={labelFor(contentStatusLabels, listing.status)}
                    tone={listing.status === 'published' ? 'green' : 'neutral'}
                  />
                  <Text {...typography.title} fontSize={15} lineHeight={20}>
                    {listing.title}
                  </Text>
                  <Text {...typography.body} marginTop={0}>
                    {money(listing.price_cents, listing.currency)}
                  </Text>
                  <Text {...typography.meta}>{labelFor(listingCategoryLabels, listing.category)}</Text>
                </YStack>
                <Text color={colors.brass400} fontSize={13} fontWeight="700">
                  Открыть
                </Text>
              </YStack>
            </AppCard>
          </Link>
        ))}
      </XStack>
      <PrimaryButton label="Разместить объявление" href="/listings/create" />
    </Screen>
  );
}
