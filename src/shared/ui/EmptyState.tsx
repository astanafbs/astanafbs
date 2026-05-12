import { Text, YStack } from 'tamagui';

import { colors, spacing } from '../../theme';
import { PrimaryButton } from './index';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <YStack
      borderRadius={22}
      borderWidth={1}
      borderColor={colors.borderSoft}
      backgroundColor={colors.cardDark}
      padding={spacing[6]}
      alignItems="center"
      marginBottom={spacing[4]}
    >
      <Text color={colors.brass400} fontSize={34}>
        ●
      </Text>
      <Text color={colors.textPrimary} fontSize={18} fontWeight="700" marginTop={spacing[3]}>
        {title}
      </Text>
      {description ? (
        <Text color={colors.textSecondary} fontSize={14} lineHeight={21} textAlign="center" marginTop={spacing[2]}>
          {description}
        </Text>
      ) : null}
      {action ? <PrimaryButton label={action.label} onPress={action.onPress} /> : null}
    </YStack>
  );
}
