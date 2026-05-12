import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';

export default function EditProfileScreen() {
  return (
    <Screen title="Профиль">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Данные игрока</Text>
        <Text {...typography.inverseBody}>Имя, город, клуб и фото для турниров, рейтинга и дуэлей.</Text>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Имя', value: 'из аккаунта' },
            { label: 'Фото', value: 'аватар игрока' },
            { label: 'Город', value: 'Астана' },
            { label: 'Клуб', value: 'не выбран' },
          ]}
        />
        <PrimaryButton label="Сохранить профиль" />
      </Card>
    </Screen>
  );
}
