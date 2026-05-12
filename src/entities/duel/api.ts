import { apiFetch } from '../../shared/lib/api';
import { Duel } from './types';

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getDuels() {
  return apiFetch<ApiList<Duel>>('/duels');
}

export async function createDuel(input: {
  opponentId: string;
  clubId?: string;
  scheduledAt?: string;
}) {
  return apiFetch<ApiItem<Duel>>('/duels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
