import { apiFetch } from '../../shared/lib/api';

export type TrainingTemplate = {
  id: string;
  title: string;
  target: string | null;
  metric: string | null;
  sort_order: number;
  status: string;
};

export type TrainingMetric = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
  sort_order: number;
  status: string;
};

export type TrainingDrill = {
  label: string;
  made: number;
  total: number;
};

export type TrainingSession = {
  id: string;
  template_id: string | null;
  template_title?: string | null;
  player_name: string;
  title: string;
  discipline: string;
  focus: string | null;
  duration_minutes: number;
  drills: TrainingDrill[];
  mood_score: number;
  notes: string | null;
  trained_at: string;
};

export type TrainingSessionInput = {
  templateId?: string | null;
  playerName: string;
  title: string;
  discipline: string;
  focus?: string | null;
  durationMinutes: number;
  drills: TrainingDrill[];
  moodScore: number;
  notes?: string | null;
  trainedAt?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getTrainingTemplates() {
  return apiFetch<ApiList<TrainingTemplate>>('/training/templates');
}

export async function getTrainingMetrics() {
  return apiFetch<ApiList<TrainingMetric>>('/training/metrics');
}

export async function getTrainingSessions() {
  return apiFetch<ApiList<TrainingSession>>('/training/sessions');
}

export async function createTrainingSession(input: TrainingSessionInput) {
  return apiFetch<ApiItem<TrainingSession>>('/training/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
