import { Link } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, typography } from '../../src/components/ui';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { colors, spacing } from '../../src/theme';

export default function SignInScreen() {
  const { isLoading, errorMessage, signInWithGoogle } = useGoogleAuth();

  return (
    <Screen title="Вход" eyebrow="Google Auth">
      <Card>
        <Text {...typography.title}>Войти через Google</Text>
        <Text {...typography.body}>
          Войдите, чтобы сохранять заявки, дуэли, рейтинг и настройки уведомлений.
        </Text>
        {errorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing[3]}>
            {errorMessage}
          </Text>
        ) : null}
        <PrimaryButton label={isLoading ? 'Подключение...' : 'Продолжить'} onPress={signInWithGoogle} />
        <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.md}>
          Продолжая регистрацию, вы принимаете{' '}
          <Link href="/legal/terms" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              Terms of Use
            </Text>
          </Link>{' '}
          и{' '}
          <Link href="/legal/privacy" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              Privacy Policy
            </Text>
          </Link>
          .
        </Text>
      </Card>
    </Screen>
  );
}
