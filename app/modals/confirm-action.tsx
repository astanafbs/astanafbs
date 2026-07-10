import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, typography } from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';

export default function ConfirmActionModal() {
  const params = useLocalSearchParams<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    redirect?: string;
  }>();

  const title = params.title ?? 'Подтверждение';
  const message = params.message ?? 'Действие выполнено.';
  const confirmLabel = params.confirmLabel ?? 'Продолжить';
  const cancelLabel = params.cancelLabel ?? 'Назад';
  const redirect = params.redirect;

  return (
    <Screen title={title}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{title}</Text>
        <Text {...typography.inverseBody}>{message}</Text>
      </Card>

      <Card>
        <XStack gap={spacing.sm}>
          <Button
            unstyled
            flex={1}
            minHeight={48}
            borderRadius={radius.md}
            backgroundColor={colors.chipDark}
            borderWidth={1}
            borderColor={colors.borderSoft}
            alignItems="center"
            justifyContent="center"
            onPress={() => router.back()}
            pressStyle={{ opacity: 0.82 }}
            style={{ borderWidth: 1, outlineWidth: 0, boxSizing: 'border-box' } as never}
          >
            <Text color={colors.textPrimary} fontSize={14} fontWeight="700">
              {cancelLabel}
            </Text>
          </Button>
          <Button
            unstyled
            flex={1}
            minHeight={48}
            borderRadius={radius.md}
            backgroundColor={colors.brass500}
            alignItems="center"
            justifyContent="center"
            onPress={() => router.replace(redirect || '/home')}
            pressStyle={{ opacity: 0.82 }}
            style={{ outlineWidth: 0, boxSizing: 'border-box' } as never}
          >
            <Text color={colors.rail900} fontSize={14} fontWeight="700">
              {confirmLabel}
            </Text>
          </Button>
        </XStack>
      </Card>
    </Screen>
  );
}
