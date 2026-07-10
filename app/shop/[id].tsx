import { useLocalSearchParams } from 'expo-router';
import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, InfoGrid, PrimaryButton, typography } from '../../src/components/ui';
import { getTrainingTemplates } from '../../src/entities/training/api';
import { useI18n } from '../../src/shared/lib/i18n';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { spacing } from '../../src/theme';

export default function TrainingTemplateScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useApiResource(() => getTrainingTemplates().then((result) => result.data), [id]);
  const template = data?.find((item) => item.id === id) ?? data?.[0] ?? null;

  if (!template) {
    return (
      <Screen title={t('training.templateScreen')}>
        <Card><Text {...typography.body}>{error ?? t('training.loadingTemplates')}</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title={t('training.templateScreen')}>
      <Card tone="dark">
        <Badge label={t('training.templateBadge')} tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {template.title}
        </Text>
        <Text {...typography.inverseBody}>{template.target}</Text>
      </Card>
      <Card>
        <InfoGrid
          items={[
            { label: t('training.drills'), value: template.metric ?? t('training.templateMetricFallback') },
            { label: t('training.format'), value: t('training.formatValue') },
            { label: t('training.media'), value: t('training.mediaValue') },
            { label: t('training.score'), value: t('training.scoreValue') },
          ]}
        />
        <PrimaryButton label={t('training.recordByTemplate')} href={`/shop?templateId=${template.id}`} />
      </Card>
    </Screen>
  );
}
