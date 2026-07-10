import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Text, TextArea, XStack, YStack } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Badge, Card, EmptyPanel, IconBadge, PrimaryButton, SectionHeader, StatRow, typography } from '../../src/components/ui';
import {
  createTrainingSession,
  getTrainingMetrics,
  getTrainingSessions,
  getTrainingTemplates,
  type TrainingDrill,
  type TrainingSession,
  type TrainingTemplate,
} from '../../src/entities/training/api';
import { shortDate } from '../../src/shared/lib/format';
import { useI18n } from '../../src/shared/lib/i18n';
import type { TranslationKey } from '../../src/shared/lib/i18n';
import { useApiResource } from '../../src/shared/lib/useApiResource';
import { colors, radius, spacing } from '../../src/theme';

const defaultDrillKeys: TranslationKey[] = [
  'training.drillBreak',
  'training.drillLong',
  'training.drillPosition',
];

const goalKeys: TranslationKey[] = [
  'training.goal1',
  'training.goal2',
  'training.goal3',
  'training.goal4',
];

export default function TrainingDiaryScreen() {
  const { t } = useI18n();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const metricsState = useApiResource(() => getTrainingMetrics().then((result) => result.data));
  const templatesState = useApiResource(() => getTrainingTemplates().then((result) => result.data));
  const sessionsState = useApiResource(() => getTrainingSessions().then((result) => result.data));
  const trainingMetrics = metricsState.data ?? [];
  const trainingTemplates = templatesState.data ?? [];
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [appliedTemplateParam, setAppliedTemplateParam] = useState<string | null>(null);
  const [focus, setFocus] = useState(t('training.defaultFocus'));
  const [duration, setDuration] = useState(75);
  const [moodScore, setMoodScore] = useState(7);
  const [notes, setNotes] = useState(t('training.defaultNotes'));
  const [drills, setDrills] = useState<TrainingDrill[]>(() =>
    defaultDrillKeys.map((key) => ({ label: t(key), made: 0, total: 10 })),
  );

  useEffect(() => {
    if (sessionsState.data) setSessions(sessionsState.data);
  }, [sessionsState.data]);

  useEffect(() => {
    const requestedTemplate = trainingTemplates.find((template) => template.id === templateId);
    if (requestedTemplate && appliedTemplateParam !== templateId) {
      setSelectedTemplateId(requestedTemplate.id);
      setFocus(requestedTemplate.target ?? t('training.defaultFocus'));
      setFormOpen(true);
      setAppliedTemplateParam(templateId ?? null);
      return;
    }

    if (!selectedTemplateId && trainingTemplates[0]) {
      setSelectedTemplateId(trainingTemplates[0].id);
      setFocus(trainingTemplates[0].target ?? t('training.defaultFocus'));
    }
  }, [appliedTemplateParam, selectedTemplateId, t, templateId, trainingTemplates]);

  const selectedTemplate = trainingTemplates.find((template) => template.id === selectedTemplateId) ?? trainingTemplates[0] ?? null;
  const sessionStats = useMemo(() => buildSessionStats(sessions), [sessions]);
  const templateTitle = selectedTemplate?.title ?? t('training.record');

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await createTrainingSession({
        templateId: selectedTemplate?.id ?? null,
        playerName: t('profile.fallbackName'),
        title: templateTitle,
        discipline: t('training.badge'),
        focus,
        durationMinutes: duration,
        drills,
        moodScore,
        notes,
        trainedAt: new Date().toISOString(),
      });
      setSessions((current) => [result.data, ...current]);
      setFormOpen(false);
      setDrills(defaultDrillKeys.map((key) => ({ label: t(key), made: 0, total: 10 })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('training.apiUnavailable'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t('training.title')}>
      <Card tone="dark">
        <Badge label={t('training.badge')} tone="green" />
        <Text {...typography.inverseTitle} marginTop={spacing.md}>
          {t('training.heroTitle')}
        </Text>
        <Text {...typography.inverseBody}>{t('training.heroBody')}</Text>
        <PrimaryButton label={isFormOpen ? t('training.cancel') : t('training.record')} onPress={() => setFormOpen((open) => !open)} />
      </Card>

      {isFormOpen ? (
        <Card>
          <Text {...typography.title}>{t('training.formTitle')}</Text>
          <Text {...typography.body}>{t('training.template')}</Text>
          <XStack flexWrap="wrap" gap={spacing.xs} marginTop={spacing.sm}>
            {trainingTemplates.map((template) => (
              <OptionChip
                key={template.id}
                label={template.title}
                active={template.id === selectedTemplate?.id}
                onPress={() => {
                  setSelectedTemplateId(template.id);
                  setFocus(template.target ?? t('training.defaultFocus'));
                }}
              />
            ))}
          </XStack>

          <YStack gap={spacing.sm} marginTop={spacing.md}>
            <FieldLabel label={t('training.focus')} />
            <Input value={focus} onChangeText={setFocus} color={colors.textPrimary} backgroundColor={colors.chipDark} borderWidth={0} />
            <XStack gap={spacing.sm}>
              <NumberStepper label={t('training.duration')} value={duration} suffix={t('training.minutes')} step={15} min={10} max={240} onChange={setDuration} />
              <NumberStepper label={t('training.mood')} value={moodScore} suffix="/10" step={1} min={1} max={10} onChange={setMoodScore} />
            </XStack>
            <FieldLabel label={t('training.drills')} />
            {drills.map((drill, index) => (
              <DrillEditor
                key={`${drill.label}-${index}`}
                drill={drill}
                madeLabel={t('training.made')}
                totalLabel={t('training.total')}
                onChange={(nextDrill) => {
                  setDrills((current) => current.map((item, itemIndex) => (itemIndex === index ? nextDrill : item)));
                }}
              />
            ))}
            <FieldLabel label={t('training.notes')} />
            <TextArea
              value={notes}
              onChangeText={setNotes}
              minHeight={92}
              color={colors.textPrimary}
              backgroundColor={colors.chipDark}
              borderWidth={0}
            />
            {error ? <Text color={colors.danger500} fontSize={13}>{error}</Text> : null}
            <PrimaryButton label={saving ? t('training.saving') : t('training.save')} onPress={handleSave} />
          </YStack>
        </Card>
      ) : null}

      <SectionHeader title={t('training.analytics')} action={t('training.analyticsAction')} />
      {metricsState.loading ? <EmptyPanel title={t('training.loadingMetrics')} body={t('training.loadingMetricsBody')} /> : null}
      <StatRow
        items={[
          { label: t('training.accuracy'), value: `${sessionStats.accuracy}%`, icon: 'medal' },
          { label: t('training.minutes'), value: sessionStats.minutes, icon: 'calendar' },
          { label: t('training.sessionCount'), value: sessions.length, icon: 'ratingList' },
        ]}
      />
      {trainingMetrics.length ? (
        <StatRow
          items={trainingMetrics.slice(0, 3).map((metric) => ({
            label: metric.label,
            value: metric.value,
            icon: metric.label === 'Макс. серия' ? 'medal' : 'ratingList',
          }))}
        />
      ) : null}

      <Card>
        <Text {...typography.title}>{t('training.aiTitle')}</Text>
        <Text {...typography.body}>{t('training.aiBody')}</Text>
      </Card>

      <SectionHeader title={t('training.templates')} />
      {templatesState.loading ? <EmptyPanel title={t('training.loadingTemplates')} body={t('training.loadingTemplatesBody')} /> : null}
      {templatesState.error ? <EmptyPanel title={t('training.apiUnavailable')} body={templatesState.error} /> : null}
      <XStack flexWrap="wrap" justifyContent="space-between" marginBottom={spacing.md}>
        {trainingTemplates.map((template) => (
          <TrainingTemplateCard key={template.id} template={template} fallback={t('training.templateMetricFallback')} />
        ))}
      </XStack>

      <SectionHeader title={t('training.history')} />
      {sessionsState.loading ? <EmptyPanel title={t('training.loadingMetrics')} body={t('training.loadingMetricsBody')} /> : null}
      {sessionsState.error ? <EmptyPanel title={t('training.apiUnavailable')} body={sessionsState.error} /> : null}
      {!sessions.length && !sessionsState.loading ? <EmptyPanel title={t('common.empty')} body={t('training.emptyHistory')} /> : null}
      {sessions.slice(0, 8).map((session) => (
        <TrainingSessionCard key={session.id} session={session} accuracyLabel={t('training.accuracy')} minutesLabel={t('training.minutes')} />
      ))}

      <SectionHeader title={t('training.goalTitle')} />
      {goalKeys.map((goal) => (
        <Card key={goal}>
          <Text {...typography.title}>{t(goal)}</Text>
          <Text {...typography.meta}>{t('training.activeGoal')}</Text>
        </Card>
      ))}
    </Screen>
  );
}

function buildSessionStats(sessions: TrainingSession[]) {
  const totals = sessions.reduce(
    (acc, session) => {
      acc.minutes += Number(session.duration_minutes) || 0;
      session.drills.forEach((drill) => {
        acc.made += Number(drill.made) || 0;
        acc.total += Number(drill.total) || 0;
      });
      return acc;
    },
    { made: 0, total: 0, minutes: 0 },
  );

  return {
    accuracy: totals.total ? Math.round((totals.made / totals.total) * 100) : 0,
    minutes: totals.minutes,
  };
}

function OptionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      unstyled
      borderWidth={0}
      borderRadius={radius.full}
      backgroundColor={active ? colors.brass500 : colors.chipDark}
      paddingHorizontal={spacing.md}
      minHeight={36}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
      style={{ borderWidth: 0, boxSizing: 'border-box' } as never}
    >
      <Text color={active ? colors.rail900 : colors.textPrimary} fontSize={12} fontWeight="600">
        {label}
      </Text>
    </Button>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text color={colors.textMuted} fontSize={12} fontWeight="600">
      {label}
    </Text>
  );
}

function NumberStepper({
  label,
  value,
  suffix,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <YStack flex={1} backgroundColor={colors.chipDark} borderRadius={radius.md} padding={spacing.sm} gap={spacing.xs}>
      <FieldLabel label={label} />
      <XStack alignItems="center" justifyContent="space-between">
        <StepperButton label="-" onPress={() => onChange(Math.max(min, value - step))} />
        <Text color={colors.textPrimary} fontSize={16} fontWeight="700">
          {value}{suffix}
        </Text>
        <StepperButton label="+" onPress={() => onChange(Math.min(max, value + step))} />
      </XStack>
    </YStack>
  );
}

function StepperButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      unstyled
      width={34}
      height={34}
      borderRadius={17}
      borderWidth={0}
      backgroundColor={colors.cardDark}
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
    >
      <Text color={colors.textPrimary} fontSize={18} fontWeight="700">
        {label}
      </Text>
    </Button>
  );
}

function DrillEditor({
  drill,
  madeLabel,
  totalLabel,
  onChange,
}: {
  drill: TrainingDrill;
  madeLabel: string;
  totalLabel: string;
  onChange: (drill: TrainingDrill) => void;
}) {
  return (
    <YStack backgroundColor={colors.chipDark} borderRadius={radius.md} padding={spacing.sm} gap={spacing.sm}>
      <Text color={colors.textPrimary} fontSize={14} fontWeight="700">
        {drill.label}
      </Text>
      <XStack gap={spacing.sm}>
        <NumberStepper
          label={madeLabel}
          value={drill.made}
          suffix=""
          step={1}
          min={0}
          max={drill.total}
          onChange={(made) => onChange({ ...drill, made })}
        />
        <NumberStepper
          label={totalLabel}
          value={drill.total}
          suffix=""
          step={5}
          min={1}
          max={200}
          onChange={(total) => onChange({ ...drill, total, made: Math.min(drill.made, total) })}
        />
      </XStack>
    </YStack>
  );
}

function TrainingTemplateCard({ template, fallback }: { template: TrainingTemplate; fallback: string }) {
  return (
    <Link href={`/shop/${template.id}`} asChild>
      <YStack
        width="49%"
        minHeight={188}
        backgroundColor={colors.cardLight}
        borderRadius={radius.lg}
        padding={spacing.md}
        marginBottom={spacing.sm}
        justifyContent="space-between"
        pressStyle={{ opacity: 0.9 }}
        style={{ boxSizing: 'border-box' } as never}
      >
        <YStack gap={spacing.sm}>
          <IconBadge icon="calendar" tone="quiet" />
          <Text {...typography.title} fontSize={15} lineHeight={20}>
            {template.title}
          </Text>
          <Text color={colors.textMuted} fontSize={12} lineHeight={17}>
            {template.target}
          </Text>
        </YStack>
        <Text color={colors.brass400} fontSize={12} fontWeight="700">
          {template.metric ?? fallback}
        </Text>
      </YStack>
    </Link>
  );
}

function TrainingSessionCard({
  session,
  accuracyLabel,
  minutesLabel,
}: {
  session: TrainingSession;
  accuracyLabel: string;
  minutesLabel: string;
}) {
  const made = session.drills.reduce((sum, drill) => sum + drill.made, 0);
  const total = session.drills.reduce((sum, drill) => sum + drill.total, 0);
  const accuracy = total ? Math.round((made / total) * 100) : 0;

  return (
    <Card>
      <XStack alignItems="center" justifyContent="space-between" gap={spacing.sm}>
        <YStack flex={1}>
          <Text {...typography.title}>{session.title}</Text>
          <Text {...typography.meta}>{shortDate(session.trained_at)}</Text>
        </YStack>
        <IconBadge icon={`${session.mood_score}/10`} tone="accent" />
      </XStack>
      <XStack gap={spacing.sm} marginTop={spacing.md}>
        <Badge label={`${accuracyLabel}: ${accuracy}%`} tone="green" />
        <Badge label={`${session.duration_minutes} ${minutesLabel}`} />
      </XStack>
      <Text {...typography.body}>{session.focus ?? session.template_title ?? session.discipline}</Text>
    </Card>
  );
}
