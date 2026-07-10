import { apiFetch } from '../../shared/lib/api';
import { PlayerProfile } from './types';

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export type RatingCity = {
  city: string;
  players_count: number;
};

export async function getRatings(input?: { city?: string | null }) {
  const params = new URLSearchParams();
  if (input?.city) params.set('city', input.city);
  const query = params.toString();
  return apiFetch<ApiList<PlayerProfile>>(`/ratings${query ? `?${query}` : ''}`);
}

export async function getRatingCities() {
  return apiFetch<ApiList<RatingCity>>('/ratings/cities');
}

export async function getPlayer(id: string) {
  return apiFetch<ApiItem<PlayerProfile>>(`/players/${id}`);
}
