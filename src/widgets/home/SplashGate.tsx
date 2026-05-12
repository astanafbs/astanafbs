import { Text, YStack } from 'tamagui';

import { colors, spacing } from '../../theme';

type SplashState = 'loading_assets' | 'checking_auth' | 'syncing_user' | 'ready' | 'error';

export function SplashGate({ state }: { state: SplashState }) {
  const labelByState: Record<SplashState, string> = {
    loading_assets: 'Загружаем ресурсы',
    checking_auth: 'Проверяем вход',
    syncing_user: 'Синхронизируем профиль',
    ready: 'Готово',
    error: 'Не удалось запустить приложение',
  };

  return (
    <YStack
      flex={1}
      backgroundColor={colors.felt900}
      alignItems="center"
      justifyContent="center"
      padding={spacing[6]}
    >
      <YStack
        width={104}
        height={104}
        borderRadius={52}
        backgroundColor={colors.chipDark}
        alignItems="center"
        justifyContent="center"
        borderWidth={4}
        borderColor={colors.brass500}
      >
        <Text color={colors.textPrimary} fontSize={26} fontWeight="700">
          BH
        </Text>
      </YStack>
      <Text color={colors.textPrimary} fontSize={20} fontWeight="700" marginTop={spacing[6]}>
        BilliardHUB
      </Text>
      <Text color={colors.textSecondary} fontSize={14} marginTop={spacing[2]}>
        {labelByState[state]}
      </Text>
    </YStack>
  );
}
