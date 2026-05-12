import { Text, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, typography } from '../../src/components/ui';
import { colors, radius, spacing } from '../../src/theme';

const fields = ['Фото', 'Имя', 'Город', 'Клуб', 'Дисциплина'];

export default function CompleteProfileScreen() {
  return (
    <Screen title="Профиль игрока">
      <Card>
        <Text {...typography.title}>Заполните короткий профиль</Text>
        <Text {...typography.body}>Эти данные нужны для регистрации на турниры и дуэли.</Text>
        <YStack gap={spacing[3]} marginTop={spacing[4]}>
          {fields.map((field) => (
            <YStack
              key={field}
              borderRadius={radius.md}
              backgroundColor={colors.chipDark}
              borderWidth={1}
              borderColor={colors.borderSoft}
              padding={spacing[4]}
            >
              <Text color={colors.textPrimary} fontWeight="600">
                {field}
              </Text>
            </YStack>
          ))}
        </YStack>
        <PrimaryButton label="Сохранить профиль" />
      </Card>
    </Screen>
  );
}
