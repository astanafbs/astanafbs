import { apiFetch } from '../../shared/lib/api';
import { PlayerProfile } from './types';

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getRatings() {
  return apiFetch<ApiList<PlayerProfile>>('/ratings');
}

export async function getPlayer(id: string) {
  return apiFetch<ApiItem<PlayerProfile>>(`/players/${id}`);
}
