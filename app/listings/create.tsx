import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';

export default function CreateListingScreen() {
  return (
    <Screen title="Новое объявление">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Черновик публикации</Text>
        <Text {...typography.inverseBody}>
          Добавьте описание, цену и фото. После отправки объявление попадет на проверку.
        </Text>
      </Card>
      <SectionHeader title="Поля формы" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Категория', value: 'инвентарь / услуги' },
            { label: 'Фото', value: 'до 6 изображений' },
            { label: 'Статус', value: 'на проверке' },
          ]}
        />
        <PrimaryButton label="Отправить на модерацию" />
      </Card>
    </Screen>
  );
}
