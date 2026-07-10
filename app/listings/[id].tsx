import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { getListing } from '../../src/entities/listing/api';
import { money } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

const categoryLabels: Record<string, string> = {
  coaches: 'Тренера',
  cues: 'Кии',
  chalk: 'Мелки',
  cases: 'Чехлы',
  tables: 'Столы',
  misc: 'Разное',
};

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, error } = useApiResource(() => getListing(id).then((result) => result.data), [id]);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  if (!listing) {
    return (
      <Screen title="Объявление">
        <Card><Text {...typography.body}>{error ?? 'Загружаем объявление...'}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Объявление">
      <Card tone="dark">
        <Badge label={categoryLabels[listing.category] ?? listing.category} />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {listing.title}
        </Text>
        <Text {...typography.inverseBody}>{money(listing.price_cents, listing.currency)}</Text>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: 'Город', value: 'Астана' },
            { label: 'Состояние', value: 'хорошее' },
            { label: 'Продавец', value: listing.user_name ?? 'профиль BilliardHUB' },
            { label: 'Категория', value: categoryLabels[listing.category] ?? listing.category },
          ]}
        />
        {contactMessage ? (
          <Text color={colors.textMuted} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {contactMessage}
          </Text>
        ) : null}
        <PrimaryButton
          label="Связаться с продавцом"
          onPress={() => {
            if (!listing.user_email) {
              setContactMessage('Контакт продавца не указан. Проверьте профиль продавца или напишите через поддержку клуба.');
              return;
            }
            const subject = encodeURIComponent(`Объявление: ${listing.title}`);
            const body = encodeURIComponent(`Здравствуйте. Интересует объявление "${listing.title}" в BilliardHUB.`);
            void Linking.openURL(`mailto:${listing.user_email}?subject=${subject}&body=${body}`);
          }}
        />
      </Card>
    </Screen>
  );
}
