import { Text, YStack } from 'tamagui';

import { colors, spacing } from '../../theme';
import { PrimaryButton } from './index';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <YStack
      borderRadius={22}
      borderWidth={1}
      borderColor={colors.danger500}
      backgroundColor={colors.cardDark}
      padding={spacing[6]}
      marginBottom={spacing[4]}
    >
      <Text color={colors.danger500} fontSize={18} fontWeight="700">
        Что-то пошло не так
      </Text>
      <Text color={colors.textSecondary} fontSize={14} lineHeight={21} marginTop={spacing[2]}>
        {message}
      </Text>
      {onRetry ? <PrimaryButton label="Повторить" onPress={onRetry} /> : null}
    </YStack>
  );
}
