import { apiFetch } from '../../shared/lib/api';
import { Tournament, TournamentMatch, TournamentRegistration } from './types';

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export type TournamentPlayer = {
  id: string;
  registration_id: string;
  display_name: string;
  photo_url: string | null;
  city: string | null;
  rating: number | null;
  club_name: string | null;
  status: string;
  seed_number: number | null;
};

export async function getTournaments() {
  return apiFetch<ApiList<Tournament>>('/tournaments');
}

export async function getTournament(id: string) {
  return apiFetch<ApiItem<Tournament>>(`/tournaments/${id}`);
}

export async function registerForTournament(id: string) {
  return apiFetch<ApiItem<TournamentRegistration>>(`/tournaments/${id}/register`, {
    method: 'POST',
  });
}

export async function getTournamentPlayers(id: string) {
  return apiFetch<ApiList<TournamentPlayer>>(`/tournaments/${id}/players`);
}

export async function getTournamentMatches(id: string) {
  return apiFetch<ApiList<TournamentMatch>>(`/tournaments/${id}/matches`);
}

export type TournamentMatchResponse = ApiList<TournamentMatch>;
