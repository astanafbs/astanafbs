import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Linking } from 'react-native';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { getClub } from '../../src/entities/club/api';
import { getTournaments } from '../../src/entities/tournament/api';
import { imageUri, shortDate } from '../../src/shared/lib/format';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

export default function ClubDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const clubState = useApiResource(() => getClub(id).then((result) => result.data), [id]);
  const tournamentsState = useApiResource(() => getTournaments().then((result) => result.data), [id]);
  const club = clubState.data;
  const clubTournaments = (tournamentsState.data ?? []).filter((item) => {
    const tournament = item as { club_id?: string | null; club_name?: string | null };
    return tournament.club_id === id || tournament.club_name === club?.name;
  });

  if (!club) {
    return (
      <Screen title="Карточка клуба">
        <Card>
          <Text {...typography.body}>{clubState.error ?? 'Загружаем клуб...'}</Text>
        </Card>
      </Screen>
    );
  }

  const uri = imageUri(club.image_key);

  return (
    <Screen title="Карточка клуба">
      <Card tone="dark">
        <Badge label="Открыто" tone="green" />
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            style={{
              width: '100%',
              height: 190,
              borderRadius: 16,
              marginTop: spacing.md,
            }}
          />
        ) : null}
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {club.name}
        </Text>
        <Text {...typography.inverseBody}>{club.address}</Text>
      </Card>

      <SectionHeader title="Информация" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Город', value: club.city },
            { label: 'Телефон', value: club.phone ?? '-' },
            { label: 'Статус', value: 'Открыто' },
            { label: '2ГИС', value: club.two_gis_url ? 'ссылка доступна' : 'нет ссылки' },
          ]}
        />
      </Card>

      <SectionHeader title="Ближайшие турниры" />
      {clubTournaments.map((tournament) => (
        <Card key={tournament.id}>
          <Text {...typography.title}>{tournament.title}</Text>
          <Text {...typography.body}>{shortDate((tournament as { starts_at?: string }).starts_at)}</Text>
        </Card>
      ))}

      {actionMessage ? (
        <Card>
          <Text color={colors.textMuted} fontSize={13} lineHeight={19}>
            {actionMessage}
          </Text>
        </Card>
      ) : null}
      {club.phone ? (
        <PrimaryButton
          label="Позвонить в клуб"
          onPress={() => {
            const phone = club.phone?.replace(/[^\d+]/g, '');
            if (!phone) {
              setActionMessage('Телефон клуба не указан.');
              return;
            }
            void Linking.openURL(`tel:${phone}`);
          }}
        />
      ) : null}
      {club.two_gis_url ? (
        <PrimaryButton label="Открыть в 2ГИС" onPress={() => void Linking.openURL(club.two_gis_url ?? '')} />
      ) : null}
    </Screen>
  );
}
