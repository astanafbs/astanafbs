import { Link } from 'expo-router';
import { Text } from 'tamagui';

import { LanguageSelector } from '../../src/components/LanguageSelector';
import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, typography } from '../../src/components/ui';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';
import { useI18n } from '../../src/shared/lib/i18n';
import { colors, spacing } from '../../src/theme';

export default function SignInScreen() {
  const { t } = useI18n();
  const { isLoading, errorMessage, signInWithGoogle } = useGoogleAuth();

  return (
    <Screen title={t('auth.signInTitle')} eyebrow={t('auth.signInEyebrow')}>
      <LanguageSelector />
      <Card>
        <Text {...typography.title}>{t('auth.signInCardTitle')}</Text>
        <Text {...typography.body}>{t('auth.signInBody')}</Text>
        {errorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing[3]}>
            {errorMessage}
          </Text>
        ) : null}
        <PrimaryButton label={isLoading ? t('auth.loading') : t('auth.continue')} onPress={signInWithGoogle} />
        <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.md}>
          {t('auth.termsPrefix')}{' '}
          <Link href="/legal/terms" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              {t('auth.terms')}
            </Text>
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link href="/legal/privacy" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              {t('auth.privacy')}
            </Text>
          </Link>
          .
        </Text>
      </Card>
    </Screen>
  );
}
