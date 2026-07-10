import { apiFetch } from '../../shared/lib/api';
import type { ClubMembership } from '../me/api';
import type { Tournament, TournamentMatch } from '../tournament/types';

export type ClubAdminRegistration = {
  id: string;
  tournament_id: string;
  tournament_title: string;
  club_id: string;
  user_id: string;
  user_name: string;
  rating?: number | null;
  club_name?: string | null;
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'rejected';
  seed_number?: number | null;
};

export type ClubAdminOverview = {
  clubs: ClubMembership[];
  tournaments: Tournament[];
  matches: TournamentMatch[];
  registrations: ClubAdminRegistration[];
};

type ApiItem<T> = { data: T };

export function getClubAdminOverview() {
  return apiFetch<ApiItem<ClubAdminOverview>>('/club-admin/overview');
}

export function createClubTournament(input: {
  clubId: string;
  title: string;
  status?: Tournament['status'];
  startsAt?: string | null;
  location?: string | null;
  discipline?: Tournament['discipline'];
  maxPlayers: 16 | 32 | 64;
  entryFeeCents?: number;
}) {
  return apiFetch<ApiItem<Tournament>>('/club-admin/tournaments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateClubRegistration(id: string, input: {
  status?: ClubAdminRegistration['status'];
  seedNumber?: number | null;
}) {
  return apiFetch<ApiItem<ClubAdminRegistration>>(`/club-admin/registrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function generateClubTournamentBracket(id: string) {
  return apiFetch<ApiItem<{ bracket_size: number; players_count: number; matches_count: number }>>(
    `/club-admin/tournaments/${id}/generate-bracket`,
    { method: 'POST' },
  );
}

export function updateClubMatch(id: string, input: {
  score?: string | null;
  status?: TournamentMatch['status'];
  winnerId?: string | null;
  tableNumber?: number | null;
}) {
  return apiFetch<ApiItem<TournamentMatch>>(`/club-admin/matches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function upsertClubMatchStream(id: string, input: {
  title?: string | null;
  status?: 'draft' | 'published' | 'archived';
}) {
  return apiFetch<ApiItem<Record<string, unknown>>>(`/club-admin/matches/${id}/stream`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
