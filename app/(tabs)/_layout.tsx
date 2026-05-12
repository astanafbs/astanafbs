import { Tabs } from 'expo-router';

import type { AppIconName } from '../../src/components/ui';
import { AppIcon } from '../../src/components/ui';
import { colors } from '../../src/theme';

const icons: Record<string, AppIconName> = {
  home: 'home',
  tournaments: 'tournament',
  rating: 'ratingList',
  duels: 'battleCueBalls',
  profile: 'profileUser',
};

export default function TabsLayout() {
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
      <Tabs.Screen name="home" options={{ title: 'Главная' }} />
      <Tabs.Screen name="tournaments" options={{ title: 'Турниры' }} />
      <Tabs.Screen name="rating" options={{ title: 'Рейтинг' }} />
      <Tabs.Screen name="duels" options={{ title: 'Дуэли' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
