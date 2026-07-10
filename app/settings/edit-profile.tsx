import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { CitySelect } from '../../src/components/CitySelect';
import { Screen } from '../../src/components/Screen';
import { Card, PrimaryButton, SectionHeader, typography } from '../../src/components/ui';
import { getMe, updateMe } from '../../src/entities/me/api';
import { getProfileStatuses } from '../../src/entities/profile-status/api';
import { useI18n } from '../../src/shared/lib/i18n';
import { setPersonalProfile, usePersonalProfile } from '../../src/shared/lib/profile-store';
import { uploadImageUri } from '../../src/shared/lib/upload';
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

export default function EditProfileScreen() {
  const { t } = useI18n();
  const personalProfile = usePersonalProfile();
  const meState = useApiResource(() => getMe());
  const profileStatusesState = useApiResource(() => getProfileStatuses().then((result) => result.data));
  const [fullName, setFullName] = useState(personalProfile.fullName);
  const [city, setCity] = useState(personalProfile.city);
  const [photoUrl, setPhotoUrl] = useState(personalProfile.photoUrl);
  const [phone, setPhone] = useState(personalProfile.phone);
  const [email, setEmail] = useState(personalProfile.email);
  const [profileStatusId, setProfileStatusId] = useState(personalProfile.profileStatusId);
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const profileStatuses = profileStatusesState.data ?? [];

  useEffect(() => {
    const remoteProfile = meState.data?.profile;
    if (!remoteProfile) return;
    if (remoteProfile.profile_status_id && !profileStatusId) {
      setProfileStatusId(remoteProfile.profile_status_id);
    }
  }, [meState.data?.profile, profileStatusId]);

  async function handleSave() {
    setSavingError(null);
    const selectedStatus = profileStatuses.find((status) => status.id === profileStatusId);

    try {
      await updateMe({
        displayName: fullName.trim() || undefined,
        city: city.trim() || undefined,
        profileStatusId: profileStatusId || null,
      });
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Не удалось сохранить профиль');
      return;
    }

    setPersonalProfile({
      fullName,
      city,
      photoUrl,
      phone,
      email,
      profileStatusId,
      profileStatusLabel: selectedStatus?.label ?? '',
      statuses: personalProfile.statuses,
    });
    setSaved(true);
  }

  async function handlePickPhoto() {
    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError(t('settings.photoUploadError'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.86,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const uploadedUrl = await uploadImageUri({
        folder: 'avatars',
        uri: asset.uri,
        filename: asset.fileName,
        contentType: asset.mimeType,
      });
      setPhotoUrl(uploadedUrl);
      setSaved(false);
    } catch {
      setPhotoError(t('settings.photoUploadError'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <Screen title={t('profile.edit')}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{t('settings.playerData')}</Text>
        <Text {...typography.inverseBody}>{t('settings.playerDataBody')}</Text>
      </Card>

      <SectionHeader title={t('settings.personalFields')} />
      <Card>
        <YStack gap={spacing.md}>
          <ProfileInput label={t('settings.fullName')} value={fullName} onChangeText={(value) => {
            setFullName(value);
            setSaved(false);
          }} />
          <CitySelect label={t('profileCreate.city')} value={city} options={cities} onChange={(value) => {
            setCity(value);
            setSaved(false);
          }} />
          <ProfileInput label={t('settings.photoUrl')} value={photoUrl} onChangeText={(value) => {
            setPhotoUrl(value);
            setSaved(false);
          }} placeholder="https://..." />
          <Button
            unstyled
            borderWidth={0}
            borderRadius={radius.md}
            backgroundColor={colors.chipDark}
            minHeight={44}
            alignItems="center"
            justifyContent="center"
            onPress={handlePickPhoto}
            disabled={uploadingPhoto}
            pressStyle={{ opacity: 0.82 }}
            style={{ borderWidth: 0, outlineWidth: 0, boxSizing: 'border-box' } as never}
          >
            <Text color={colors.brass400} fontSize={13} fontWeight="600">
              {uploadingPhoto ? t('settings.uploadingPhoto') : t('settings.choosePhoto')}
            </Text>
          </Button>
          {photoError ? (
            <Text color={colors.danger500} fontSize={12} fontWeight="600">
              {photoError}
            </Text>
          ) : null}
          <ProfileInput label={t('settings.phone')} value={phone} onChangeText={(value) => {
            setPhone(value);
            setSaved(false);
          }} keyboardType="phone-pad" />
          <ProfileInput label={t('settings.email')} value={email} onChangeText={(value) => {
            setEmail(value);
            setSaved(false);
          }} keyboardType="email-address" />
        </YStack>
      </Card>

      <SectionHeader title={t('settings.profileStatus')} />
      <Card>
        {profileStatusesState.loading ? (
          <Text {...typography.meta}>Загружаем статусы...</Text>
        ) : null}
        {profileStatusesState.error ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19}>
            {profileStatusesState.error}
          </Text>
        ) : null}
        <XStack flexWrap="wrap" gap={spacing.sm}>
          {profileStatuses.map((status) => (
            <StatusChip
              key={status.id}
              label={status.label}
              active={profileStatusId === status.id}
              onPress={() => {
                setProfileStatusId(status.id);
                setSaved(false);
              }}
            />
          ))}
        </XStack>
        {savingError ? (
          <Text color={colors.danger500} fontSize={13} lineHeight={19} marginTop={spacing.md}>
            {savingError}
          </Text>
        ) : null}
        {saved ? (
          <Text color={colors.success500} fontSize={13} fontWeight="600" marginTop={spacing.md}>
            {t('settings.saved')}
          </Text>
        ) : null}
        <PrimaryButton label={t('profileCreate.save')} onPress={handleSave} />
      </Card>
    </Screen>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <YStack gap={spacing.xs}>
      <Text color={colors.textMuted} fontSize={12} fontWeight="600">
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
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
