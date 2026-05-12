import { YStack } from 'tamagui';

import { colors, spacing } from '../../theme';

export function Skeleton({ height = 96 }: { height?: number }) {
  return (
    <YStack
      height={height}
      borderRadius={22}
      backgroundColor={colors.felt800}
      opacity={0.65}
      marginBottom={spacing[4]}
    />
  );
}
