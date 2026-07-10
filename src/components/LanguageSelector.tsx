import { Text, XStack } from 'tamagui';

import { localeLabel, locales, useI18n } from '../shared/lib/i18n';
import { colors, radius, spacing } from '../theme';

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <XStack
      accessibilityLabel={t('language.select')}
      backgroundColor={colors.cardDark}
      borderRadius={radius.full}
      padding={4}
      justifyContent="space-between"
      marginBottom={spacing.md}
      style={{ boxSizing: 'border-box' } as never}
    >
      {locales().map((item) => {
        const active = item === locale;
        return (
          <Text
            key={item}
            onPress={() => setLocale(item)}
            width="32%"
            borderRadius={radius.full}
            backgroundColor={active ? colors.brass500 : 'transparent'}
            color={active ? colors.rail900 : colors.textSecondary}
            fontSize={12}
            fontWeight="600"
            paddingVertical={9}
            textAlign="center"
          >
            {localeLabel(item)}
          </Text>
        );
      })}
    </XStack>
  );
}
