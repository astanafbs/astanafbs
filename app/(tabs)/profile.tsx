import { Text, XStack } from 'tamagui';

import { LanguageSelector } from '../../src/components/LanguageSelector';
import { Screen } from '../../src/components/Screen';
import { Avatar, Badge, Card, PrimaryButton, SectionHeader, StatRow, typography } from '../../src/components/ui';
import { getMe } from '../../src/entities/me/api';
import { getRatings } from '../../src/entities/player/api';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { syncPushToken } from '../../src/features/push-token-sync/api';
import { useI18n } from '../../src/shared/lib/i18n';
import { usePersonalProfile } from '../../src/shared/lib/profile-store';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const { t } = useI18n();
  const personalProfile = usePersonalProfile();
  const playersState = useApiResource(() => getRatings().then((result) => result.data));
  const meState = useApiResource(() => getMe());
  const player = playersState.data?.[0] ?? null;
  const winPercent = player?.win_percentage ?? 0;
  const profileStatusLabel = meState.data?.profile?.profile_status_label ?? personalProfile.profileStatusLabel;
  const {
    expoPushToken,
    permissionStatus,
    errorMessage: pushErrorMessage,
    lastNotification,
    registerForPushNotifications,
  } = usePushNotifications();

  async function handleEnableNotifications() {
    const token = await registerForPushNotifications();
    if (token) {
      await syncPushToken(token).catch(() => null);
    }
  }

  return (
    <Screen title={t('profile.title')} right={<Avatar initials="BH" />}>
      <Card>
        <Avatar initials="BH" />
        <Text {...typography.title} marginTop={spacing.md}>
          {personalProfile.fullName || player?.display_name || t('profile.fallbackName')}
        </Text>
        <Text {...typography.body}>
          {t('profile.summary', {
            city: personalProfile.city || player?.city || 'Астана',
            rating: player?.rating ?? 0,
            titles: player?.titles?.join(', ') || t('profile.noTitles'),
          })}
        </Text>
        {profileStatusLabel ? (
          <XStack marginTop={spacing.md}>
            <Badge label={profileStatusLabel} tone="warning" />
          </XStack>
        ) : null}
        <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.sm}>
          {t('profile.mvpNotice')}
        </Text>
        <PrimaryButton label={t('profile.edit')} href="/settings/edit-profile" />
      </Card>

      <StatRow
        compact
        items={[
          { label: t('profile.rating'), value: player?.rating ?? 0, icon: 'ratingList' },
          { label: t('profile.winRate'), value: `${winPercent}%`, icon: 'medal' },
          { label: t('profile.matches'), value: (player?.wins ?? 0) + (player?.losses ?? 0), icon: 'match' },
        ]}
      />

      <SectionHeader title={t('profile.language')} />
      <Card>
        <LanguageSelector />
      </Card>

      <SectionHeader title="Доступы" />
      <Card>
        {(meState.data?.entitlements ?? []).map((entitlement) => (
          <Text key={entitlement.feature} {...typography.meta}>
            {entitlement.feature}: {entitlement.active ? 'активен' : 'не активен'} до {entitlement.ends_at ? new Date(entitlement.ends_at).toLocaleDateString('ru-RU') : 'без срока'}
          </Text>
        ))}
        {meState.data?.clubMemberships.length ? (
          <Text {...typography.body}>Клуб: {meState.data.clubMemberships.map((membership) => membership.club_name).join(', ')}</Text>
        ) : null}
      </Card>

      <SectionHeader title={t('profile.history')} />
      {[t('profile.sampleResult1'), t('profile.sampleResult2'), t('profile.sampleResult3')].map((result) => (
        <Card key={result}>
          <Text {...typography.title}>{result}</Text>
          <Text {...typography.meta}>{t('profile.resultConfirmed')}</Text>
        </Card>
      ))}

      <SectionHeader title={t('profile.notifications')} />
      <Card>
        <Text {...typography.title}>{t('profile.notificationsTitle')}</Text>
        <Text {...typography.body}>{t('profile.notificationsBody')}</Text>
        <Text color={colors.textSecondary} fontSize={13} fontWeight="600" marginTop={spacing.md}>
          {t('profile.permissionStatus', { status: permissionStatus })}
        </Text>
        {expoPushToken ? (
          <Text color={colors.textMuted} fontSize={12} lineHeight={18} marginTop={spacing.sm}>
            {expoPushToken}
          </Text>
        ) : null}
        {lastNotification ? (
          <Text {...typography.meta}>
            {t('profile.lastNotification', { title: lastNotification.request.content.title ?? t('profile.noTitle') })}
          </Text>
        ) : null}
        {pushErrorMessage ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.sm}>
            {pushErrorMessage}
          </Text>
        ) : null}
        <PrimaryButton label={t('profile.enableNotifications')} onPress={handleEnableNotifications} />
      </Card>
    </Screen>
  );
}
