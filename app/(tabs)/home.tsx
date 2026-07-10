import { Link } from 'expo-router';
import { useState } from 'react';
import { ImageBackground } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { CitySelect } from '../../src/components/CitySelect';
import { Screen } from '../../src/components/Screen';
import { Avatar, Badge, Card, EmptyPanel, IconBadge, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { getClubs } from '../../src/entities/club/api';
import { getNews } from '../../src/entities/news/api';
import type { NewsPost } from '../../src/entities/news/types';
import { getMe, hasActiveEntitlement } from '../../src/entities/me/api';
import { getRatings } from '../../src/entities/player/api';
import { getTournaments } from '../../src/entities/tournament/api';
import type { Tournament } from '../../src/entities/tournament/types';
import { imageUri, shortDate } from '../../src/shared/lib/format';
import { useI18n } from '../../src/shared/lib/i18n';
import { labelFor, tournamentStatusLabels } from '../../src/shared/lib/labels';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const majorKazakhstanCities = [
  'Астана',
  'Алматы',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Өскемен',
  'Семей',
  'Атырау',
  'Қостанай',
  'Қызылорда',
  'Орал',
  'Петропавл',
  'Ақтау',
  'Түркістан',
  'Көкшетау',
  'Талдықорған',
  'Екібастұз',
  'Рудный',
];

type HomeBannerData = {
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image?: string | null;
};

export default function HomeScreen() {
  const { t } = useI18n();
  const clubsState = useApiResource(() => getClubs().then((result) => result.data));
  const tournamentsState = useApiResource(() => getTournaments().then((result) => result.data));
  const newsState = useApiResource(() => getNews().then((result) => result.data));
  const playersState = useApiResource(() => getRatings().then((result) => result.data));
  const meState = useApiResource(() => getMe());
  const clubs = clubsState.data ?? [];
  const tournaments = tournamentsState.data ?? [];
  const news = newsState.data ?? [];
  const players = playersState.data ?? [];
  const cities = Array.from(new Set([...majorKazakhstanCities, ...clubs.map((club) => club.city || 'Казахстан')]));
  const [city, setCity] = useState('Астана');
  const activeCity = cities.includes(city) ? city : (cities[0] ?? 'Астана');
  const cityClubs = clubs.filter((club) => club.city === activeCity);
  const cityTournaments = tournaments.filter((tournament) => tournament.club_city === activeCity);
  const featuredTournaments = (cityTournaments.length ? cityTournaments : tournaments).slice(0, 2);
  const promoBanner = buildPromoBanner(featuredTournaments[0] ?? tournaments[0] ?? null, news[0] ?? null);

  const canManageClub = hasActiveEntitlement(meState.data, 'club_admin') && Boolean(meState.data?.clubMemberships.length);
  const quickActions = [
    ...(canManageClub ? [{ title: 'Мой клуб', href: '/club-admin', subtitle: 'Турниры, столы, счет', icon: 'club' }] : []),
    { title: t('quick.tournaments'), href: '/tournaments', subtitle: t('quick.tournamentsSubtitle'), icon: 'tournament' },
    { title: t('quick.streams'), href: '/streams', subtitle: t('quick.streamsSubtitle'), icon: 'stream' },
    { title: t('quick.clubs'), href: '/clubs', subtitle: t('quick.clubsSubtitle'), icon: 'clubPin' },
    { title: t('quick.duels'), href: '/duels', subtitle: t('quick.duelsSubtitle'), icon: 'match' },
    { title: t('quick.news'), href: '/news', subtitle: t('quick.newsSubtitle'), icon: 'listing' },
    { title: t('quick.listings'), href: '/listings', subtitle: t('quick.listingsSubtitle'), icon: 'listing' },
    { title: t('quick.diary'), href: '/shop', subtitle: t('quick.diarySubtitle'), icon: 'calendar' },
  ];

  return (
    <Screen title={t('home.title')} right={<Avatar initials="BH" />}>
      <HomePromoBanner banner={promoBanner} />

      <CitySelect label={t('home.citySelect')} value={activeCity} options={cities} onChange={setCity} />

      <StatRow
        items={[
          { label: t('home.players'), value: players.length, icon: 'players' },
          { label: t('home.tournaments'), value: cityTournaments.length, icon: 'tournament' },
          { label: t('home.clubs'), value: cityClubs.length, icon: 'clubPin' },
        ]}
      />

      <SectionHeader title={t('home.events')} action={t('home.active')} />
      {tournamentsState.error ? <EmptyPanel title={t('home.tournamentsUnavailable')} body={tournamentsState.error} /> : null}
      {!tournamentsState.loading && tournaments.length === 0 ? (
        <EmptyPanel title={t('home.noTournamentsTitle')} body={t('home.noTournamentsBody')} />
      ) : null}
      {featuredTournaments.map((tournament) => (
        <Card key={tournament.id} tone="green" href={`/tournaments/${tournament.id}`}>
          <Badge label={labelFor(tournamentStatusLabels, tournament.status)} tone="green" />
          <Text {...typography.cardTitle} marginTop={spacing.md}>
            {tournament.title}
          </Text>
          <Text {...typography.inverseBody}>{shortDate(tournament.starts_at)}</Text>
        </Card>
      ))}

      <SectionHeader title={t('home.quickNav')} />
      <XStack flexWrap="wrap" gap={spacing.sm} marginBottom={spacing.md}>
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} asChild>
            <Button
              unstyled
              width="48.5%"
              minHeight={94}
              backgroundColor={colors.cardLight}
              borderWidth={0}
              borderRadius={22}
              padding={spacing.md}
              justifyContent="space-between"
              alignItems="flex-start"
              pressStyle={{ opacity: 0.82 }}
              style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
            >
              <IconBadge icon={action.icon} tone="quiet" />
              <Text color={colors.textPrimary} fontSize={15} fontWeight="600">
                {action.title}
              </Text>
              <Text color={colors.textMuted} fontSize={12} lineHeight={17}>
                {action.subtitle}
              </Text>
            </Button>
          </Link>
        ))}
      </XStack>

      <SectionHeader title={t('home.news')} action={t('home.all')} />
      {newsState.error ? (
        <EmptyPanel title={t('home.newsUnavailable')} body={newsState.error} />
      ) : null}
      {news.map((item) => (
        <Card key={item.id} href={`/news/${item.id}`}>
          <XStack justifyContent="space-between" alignItems="center" gap={spacing.sm}>
            <Badge label={t('quick.news')} />
            <Text {...typography.meta}>{shortDate((item as { published_at?: string }).published_at)}</Text>
          </XStack>
          <Text {...typography.title} marginTop={spacing.md}>
            {item.title}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

function buildPromoBanner(tournament: Tournament | null, news: NewsPost | null): HomeBannerData {
  if (tournament) {
    return {
      href: `/tournaments/${tournament.id}`,
      eyebrow: labelFor(tournamentStatusLabels, tournament.status),
      title: tournament.title,
      subtitle: `${tournament.club_name ?? tournament.location ?? 'Турнир BilliardHUB'} · ${shortDate(tournament.starts_at)}`,
      image: imageUri(tournament.banner_key),
    };
  }

  if (news) {
    return {
      href: `/news/${news.id}`,
      eyebrow: 'Новость',
      title: news.title,
      subtitle: shortDate(news.published_at ?? news.created_at),
      image: imageUri(news.image_key),
    };
  }

  return {
    href: '/tournaments',
    eyebrow: 'BilliardHUB',
    title: 'Турниры и новости бильярда',
    subtitle: 'Актуальные события появятся здесь после публикации',
    image: null,
  };
}

function HomePromoBanner({ banner }: { banner: HomeBannerData }) {
  return (
    <Link href={banner.href} asChild>
      <Button
        unstyled
        minHeight={188}
        borderRadius={radius.lg}
        overflow="hidden"
        backgroundColor={colors.cardDark}
        marginBottom={spacing.md}
        pressStyle={{ opacity: 0.9 }}
        style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
      >
        {banner.image ? (
          <ImageBackground
            source={{ uri: banner.image }}
            resizeMode="cover"
            style={{ width: '100%', minHeight: 188 }}
            imageStyle={{ borderRadius: radius.lg }}
          >
            <BannerContent banner={banner} />
          </ImageBackground>
        ) : (
          <BannerContent banner={banner} />
        )}
      </Button>
    </Link>
  );
}

function BannerContent({ banner }: { banner: HomeBannerData }) {
  return (
    <YStack
      minHeight={188}
      justifyContent="flex-end"
      padding={spacing.lg}
      backgroundColor="rgba(2, 6, 23, 0.58)"
      gap={spacing.sm}
    >
      <Badge label={banner.eyebrow} tone="warning" />
      <Text {...typography.inverseTitle} numberOfLines={2}>
        {banner.title}
      </Text>
      <Text {...typography.inverseBody} numberOfLines={2}>
        {banner.subtitle}
      </Text>
    </YStack>
  );
}
