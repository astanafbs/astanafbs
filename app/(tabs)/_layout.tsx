import { Tabs } from 'expo-router';

import type { AppIconName } from '../../src/components/ui';
import { AppIcon } from '../../src/components/ui';
import { useI18n } from '../../src/shared/lib/i18n';
import { colors } from '../../src/theme';

const icons: Record<string, AppIconName> = {
  home: 'home',
  tournaments: 'tournament',
  rating: 'ratingList',
  duels: 'match',
  profile: 'profileUser',
};

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandBright,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarIcon: ({ color }) => (
          <AppIcon name={icons[route.name] ?? 'home'} color={color} size={22} />
        ),
      })}
      initialRouteName="home"
    >
      <Tabs.Screen name="home" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="tournaments" options={{ title: t('tabs.tournaments') }} />
      <Tabs.Screen name="rating" options={{ title: t('tabs.rating') }} />
      <Tabs.Screen name="duels" options={{ title: t('tabs.duels') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
