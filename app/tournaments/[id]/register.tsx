import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Text, XStack } from 'tamagui';

import { Screen } from '../../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, SectionHeader, typography } from '../../../src/components/ui';
import { getTournament } from '../../../src/entities/tournament/api';
import { submitTournamentRegistration } from '../../../src/features/tournament-register/api';
import { money, shortDate } from '../../../src/shared/lib/format';
import { labelFor, tournamentFormatLabels } from '../../../src/shared/lib/labels';
import { useApiResource } from '../../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../../src/theme';

export default function TournamentRegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentState = useApiResource(() => getTournament(id).then((result) => result.data), [id]);
  const tournament = tournamentState.data;
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const isOpen = tournament?.status === 'registration_open';
  const isFull = tournament ? Number(tournament.registrations_count ?? 0) >= Number(tournament.max_players ?? Infinity) : false;

  if (!tournament) {
    return (
      <Screen title="Регистрация">
        <Card><Text {...typography.body}>{tournamentState.error ?? 'Загружаем турнир...'}</Text></Card>
      </Screen>
    );
  }

  async function handleSubmit() {
    if (status === 'submitting') return;
    if (!isOpen || isFull) {
      setStatus('error');
      setMessage(isFull ? 'Лимит участников уже заполнен.' : 'Регистрация на этот турнир закрыта.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      await submitTournamentRegistration(tournament.id);
      setStatus('success');
      setMessage('Заявка отправлена. Организатор подтвердит ее в админке.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить заявку');
    }
  }

  return (
    <Screen title="Регистрация">
      <Card tone="dark">
        <Badge label={tournament.discipline} tone="green" />
        <Text {...typography.inverseTitle}>{tournament.title}</Text>
        <Text {...typography.inverseBody}>Заявка попадет в очередь до подтверждения организатором.</Text>
      </Card>
      <SectionHeader title="Флоу регистрации" />
      <Card>
        {['Проверка лимита', 'Отправка заявки', 'Подтверждение организатором', 'Появление в списке игроков'].map((step, index) => (
          <XStack key={step} alignItems="center" gap={spacing.sm} paddingVertical={spacing.xs}>
            <Badge label={String(index + 1)} tone={index < 2 ? 'green' : 'neutral'} />
            <Text color={colors.textPrimary} fontSize={14} fontWeight="600">
              {step}
            </Text>
          </XStack>
        ))}
      </Card>
      <SectionHeader title="Условия участия" />
      <Card>
        <InfoGrid
          items={[
            { label: 'Дата', value: shortDate(tournament.starts_at) },
            { label: 'Дисциплина', value: tournament.discipline },
            { label: 'Формат', value: labelFor(tournamentFormatLabels, tournament.tournament_format) },
            { label: 'Взнос', value: money(tournament.entry_fee_cents, tournament.currency) },
            { label: 'Игроки', value: `${tournament.registrations_count ?? 0}/${tournament.max_players ?? '-'}` },
            { label: 'Статус', value: isFull ? 'лимит заполнен' : tournament.status },
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
        <Button
          unstyled
          minHeight={48}
          borderRadius={16}
          backgroundColor={!isOpen || isFull || status === 'success' ? colors.chipDark : colors.brass500}
          alignItems="center"
          justifyContent="center"
          marginTop={spacing.md}
          disabled={status === 'submitting' || status === 'success'}
          onPress={handleSubmit}
          pressStyle={{ opacity: 0.82 }}
        >
          <Text color={!isOpen || isFull || status === 'success' ? colors.textSecondary : colors.rail900} fontSize={15} fontWeight="700">
            {status === 'submitting' ? 'Отправляем...' : status === 'success' ? 'Заявка отправлена' : 'Отправить заявку'}
          </Text>
        </Button>
        {status === 'success' ? (
          <PrimaryButton label="Список участников" onPress={() => router.push(`/tournaments/${tournament.id}/players`)} />
        ) : null}
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
