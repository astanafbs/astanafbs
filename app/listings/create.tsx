import { useState } from 'react';
import { Button, Input, Text, TextArea, XStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, EmptyPanel, SectionHeader, typography } from '../../src/components/ui';
import { createListing, type Listing } from '../../src/entities/listing/api';
import { getMe, hasActiveEntitlement } from '../../src/entities/me/api';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const categories: Array<{ label: string; value: Listing['category'] }> = [
  { label: 'Кии', value: 'cues' },
  { label: 'Тренеры', value: 'coaches' },
  { label: 'Мел', value: 'chalk' },
  { label: 'Чехлы', value: 'cases' },
  { label: 'Столы', value: 'tables' },
  { label: 'Разное', value: 'misc' },
];

export default function CreateListingScreen() {
  const meState = useApiResource(() => getMe());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Listing['category']>('cues');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canPublish = hasActiveEntitlement(meState.data, 'listing_publish');

  async function handleSubmit() {
    if (!title.trim()) {
      setMessage('Введите название объявления');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim() || null,
        category,
        priceCents: price ? Math.round(Number(price) * 100) : null,
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setMessage('Объявление отправлено на модерацию. Срок публикации после одобрения: 7 дней.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить объявление');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Новое объявление">
      {!canPublish && !meState.loading ? (
        <EmptyPanel title="Размещение недоступно" body="Срок доступа к размещению объявлений истек или не выдан." />
      ) : null}

      {message ? <Card><Text {...typography.title}>{message}</Text></Card> : null}

      <SectionHeader title="Публикация" />
      <Card>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Название"
          color={colors.textPrimary}
          backgroundColor={colors.chipDark}
          borderWidth={0}
        />
        <TextArea
          value={description}
          onChangeText={setDescription}
          placeholder="Описание"
          minHeight={120}
          marginTop={spacing.sm}
          color={colors.textPrimary}
          backgroundColor={colors.chipDark}
          borderWidth={0}
        />
        <Input
          value={price}
          onChangeText={setPrice}
          placeholder="Цена, ₸"
          keyboardType="number-pad"
          marginTop={spacing.sm}
          color={colors.textPrimary}
          backgroundColor={colors.chipDark}
          borderWidth={0}
        />
        <XStack flexWrap="wrap" gap={spacing.sm} marginTop={spacing.md}>
          {categories.map((item) => (
            <Button
              key={item.value}
              unstyled
              minHeight={40}
              borderRadius={radius.md}
              paddingHorizontal={spacing.md}
              backgroundColor={category === item.value ? colors.brass500 : colors.chipDark}
              alignItems="center"
              justifyContent="center"
              onPress={() => setCategory(item.value)}
            >
              <Text color={category === item.value ? colors.rail900 : colors.textPrimary} fontWeight="700">
                {item.label}
              </Text>
            </Button>
          ))}
        </XStack>
        <Button
          unstyled
          minHeight={48}
          borderRadius={radius.md}
          backgroundColor={canPublish ? colors.brass500 : colors.chipDark}
          alignItems="center"
          justifyContent="center"
          marginTop={spacing.md}
          disabled={!canPublish || saving}
          onPress={handleSubmit}
        >
          <Text color={canPublish ? colors.rail900 : colors.textMuted} fontWeight="700">
            {saving ? 'Отправляем...' : 'Отправить на модерацию'}
          </Text>
        </Button>
      </Card>
    </Screen>
  );
}
