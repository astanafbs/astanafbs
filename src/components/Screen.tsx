import { usePathname, useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { colors, spacing } from '../theme';

type ScreenProps = {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, eyebrow = 'BilliardHUB', right, children }: ScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rootTabs = ['/home', '/tournaments', '/rating', '/duels', '/profile'];
  const canShowBack = !rootTabs.includes(pathname);
  const goBack = () => {
    const canGoBack = (router as { canGoBack?: () => boolean }).canGoBack?.() ?? false;
    if (canGoBack) {
      router.back();
      return;
    }

    router.replace('/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.felt900 }} edges={['top']}>
      <YStack flex={1} backgroundColor={colors.felt900}>
        <XStack
          backgroundColor={colors.felt900}
          paddingHorizontal={spacing.xl}
          paddingTop={spacing.md}
          paddingBottom={spacing.xl}
          alignItems="center"
          justifyContent="space-between"
          gap={spacing.md}
        >
          {canShowBack ? (
            <Button
              unstyled
              width={40}
              height={40}
              borderRadius={20}
              backgroundColor={colors.chipDark}
              borderWidth={1}
              borderColor={colors.borderSoft}
              alignItems="center"
              justifyContent="center"
              pressStyle={{ opacity: 0.82 }}
              onPress={goBack}
            >
              <Text color={colors.textPrimary} fontSize={23} lineHeight={24} fontWeight="500">
                ‹
              </Text>
            </Button>
          ) : null}
          <YStack flex={1}>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              {eyebrow.toUpperCase()}
            </Text>
            <Text
              color={colors.white}
              fontSize={26}
              lineHeight={32}
              fontWeight="700"
              marginTop={4}
            >
              {title}
            </Text>
          </YStack>
          {right}
        </XStack>

        <ScrollView
          flex={1}
          backgroundColor={colors.felt900}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: 112,
          }}
        >
          {children}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
