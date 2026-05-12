import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../../src/components/ui';
import { tournaments } from '../../../src/data/mock';
import { submitTournamentRegistration } from '../../../src/features/tournament-register/api';
import { colors, spacing } from '../../../src/theme';

export default function TournamentRegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournament = tournaments.find((item) => item.id === id) ?? tournaments[0];
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (status === 'submitting') return;

    setStatus('submitting');
    setMessage(null);

    try {
      await submitTournamentRegistration(tournament.id);
      setStatus('success');
      setMessage('Заявка отправлена. Статус: pending.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить заявку');
    }
  }

  return (
    <Screen title="Регистрация">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{tournament.title}</Text>
        <Text {...typography.inverseBody}>Заявка попадет в статус pending до подтверждения организатором.</Text>
      </Card>
      <SectionHeader title="Условия участия" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Дата', value: tournament.fullDate },
            { label: 'Взнос', value: tournament.fee },
            { label: 'Игроки', value: `${tournament.players}/${tournament.maxPlayers}` },
            { label: 'Статус', value: 'pending' },
          ]}
        />
        {message ? (
          <Text
            color={status === 'success' ? colors.success500 : colors.danger500}
            fontSize={13}
            lineHeight={19}
            marginTop={spacing.sm}
          >
            {message}
          </Text>
        ) : null}
        <PrimaryButton
          label={status === 'submitting' ? 'Отправляем...' : status === 'success' ? 'Заявка отправлена' : 'Отправить заявку'}
          onPress={handleSubmit}
        />
        <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.md}>
          Отправляя заявку, вы принимаете{' '}
          <Link href="/legal/terms" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              Terms of Use
            </Text>
          </Link>{' '}
          и{' '}
          <Link href="/legal/privacy" asChild>
            <Text color={colors.brass400} fontSize={12} fontWeight="600">
              Privacy Policy
            </Text>
          </Link>
          .
        </Text>
      </Card>
    </Screen>
  );
}
