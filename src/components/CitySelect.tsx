import { useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { colors, radius, spacing } from '../theme';

export function CitySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <YStack gap={spacing.xs} marginBottom={spacing.md}>
      <Text color={colors.textMuted} fontSize={12} fontWeight="600">
        {label}
      </Text>
      <Button
        unstyled
        minHeight={46}
        borderRadius={radius.md}
        backgroundColor={colors.cardLight}
        borderWidth={0}
        borderColor="transparent"
        paddingHorizontal={spacing.md}
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
        onPress={() => setOpen((current) => !current)}
        pressStyle={{ opacity: 0.82 }}
        style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
      >
        <Text color={colors.textPrimary} fontSize={15} fontWeight="600">
          {value}
        </Text>
        <Text color={colors.brass400} fontSize={17} lineHeight={18}>
          {open ? '⌃' : '⌄'}
        </Text>
      </Button>
      {open ? (
        <XStack flexWrap="wrap" gap={spacing.xs}>
          {options.map((city) => {
            const active = city === value;
            return (
              <Button
                key={city}
                unstyled
                borderRadius={radius.full}
                backgroundColor={active ? colors.brass500 : colors.chipDark}
                borderWidth={0}
                borderColor="transparent"
                paddingHorizontal={spacing.md}
                minHeight={36}
                alignItems="center"
                justifyContent="center"
                onPress={() => {
                  onChange(city);
                  setOpen(false);
                }}
                pressStyle={{ opacity: 0.82 }}
                style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
              >
                <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="600">
                  {city}
                </Text>
              </Button>
            );
          })}
        </XStack>
      ) : null}
    </YStack>
  );
}
