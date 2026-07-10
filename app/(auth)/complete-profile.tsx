import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { CitySelect } from '../../src/components/CitySelect';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { updateMe } from '../../src/entities/me/api';
import { getProfileStatuses } from '../../src/entities/profile-status/api';
import { useI18n } from '../../src/shared/lib/i18n';
import { getPersonalProfile, setPersonalProfile } from '../../src/shared/lib/profile-store';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const cities = [
  'Астана',
  'Алматы',
  'Шымкент',
  'Караганда',
  'Актобе',
  'Тараз',
  'Павлодар',
  'Атырау',
  'Қостанай',
  'Ақтау',
  'Семей',
  'Өскемен',
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const personalProfile = getPersonalProfile();
  const statusesState = useApiResource(() => getProfileStatuses().then((result) => result.data));
  const [fullName, setFullName] = useState(personalProfile.fullName);
  const [city, setCity] = useState(personalProfile.city || 'Астана');
  const [clubName, setClubName] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [profileStatusId, setProfileStatusId] = useState(personalProfile.profileStatusId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileStatuses = statusesState.data ?? [];

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);

    const selectedStatus = profileStatuses.find((status) => status.id === profileStatusId);
    try {
      await updateMe({
        displayName: fullName.trim() || undefined,
        city: city.trim() || undefined,
        clubName: clubName.trim() || undefined,
        skillLevel: skillLevel.trim() || undefined,
        profileStatusId: profileStatusId || null,
      });
      setPersonalProfile({
        ...personalProfile,
        fullName,
        city,
        profileStatusId,
        profileStatusLabel: selectedStatus?.label ?? '',
      });
      router.replace('/home');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t('profileCreate.title')}>
      <LanguageSelector />
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{t('profileCreate.cardTitle')}</Text>
        <Text {...typography.inverseBody}>{t('profileCreate.body')}</Text>
      </Card>

      <SectionHeader title={t('settings.personalFields')} />
      <Card>
        <YStack gap={spacing.md}>
          <ProfileInput label={t('profileCreate.name')} value={fullName} onChangeText={setFullName} />
          <CitySelect label={t('profileCreate.city')} value={city} options={cities} onChange={setCity} />
          <ProfileInput label={t('profileCreate.club')} value={clubName} onChangeText={setClubName} />
          <ProfileInput label={t('profileCreate.discipline')} value={skillLevel} onChangeText={setSkillLevel} />
        </YStack>
      </Card>

      <SectionHeader title={t('settings.profileStatus')} />
      <Card>
        <XStack flexWrap="wrap" gap={spacing.sm}>
          {profileStatuses.map((status) => (
            <StatusChip
              key={status.id}
              label={status.label}
              active={profileStatusId === status.id}
              onPress={() => setProfileStatusId(status.id)}
            />
          ))}
        </XStack>
        {statusesState.loading ? <Text {...typography.meta}>Загружаем статусы...</Text> : null}
        {statusesState.error ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {statusesState.error}
          </Text>
        ) : null}
        {error ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton label={saving ? t('training.saving') : t('profileCreate.save')} onPress={handleSave} />
      </Card>
    </Screen>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <YStack gap={spacing.xs}>
      <Text color={colors.textMuted} fontSize={12} fontWeight="600">
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        backgroundColor={colors.chipDark}
        borderWidth={0}
        color={colors.textPrimary}
        minHeight={46}
        borderRadius={radius.md}
        paddingHorizontal={spacing.md}
      />
    </YStack>
  );
}

function StatusChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      unstyled
      borderWidth={0}
      borderRadius={radius.full}
      backgroundColor={active ? colors.brass500 : colors.chipDark}
      paddingHorizontal={spacing.md}
      minHeight={38}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
    >
      <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="600">
        {label}
      </Text>
    </Button>
  );
}
