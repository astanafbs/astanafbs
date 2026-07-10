import { ApiRequestError, apiAuthHeaders, apiFetch, apiUrl } from '../../shared/lib/api';

export type Stream = {
  id: string;
  title: string;
  match_id?: string | null;
  status: string;
  starts_at: string | null;
  has_player?: boolean | null;
  tournament_id?: string | null;
  tournament_title?: string | null;
  round_name?: string | null;
  player_a_name?: string | null;
  player_b_name?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getStreams() {
  return apiFetch<ApiList<Stream>>('/streams');
}

export async function getStream(id: string) {
  return apiFetch<ApiItem<Stream>>(`/streams/${id}`);
}

export async function getMatchStream(matchId: string) {
  return apiFetch<ApiItem<Stream>>(`/matches/${matchId}/stream`);
}

export function getStreamPlayerSource(streamId: string) {
  return {
    uri: apiUrl(`/streams/${streamId}/player`),
    headers: apiAuthHeaders(),
  };
}

export async function getOptionalMatchStream(matchId: string) {
  try {
    return await getMatchStream(matchId);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return { data: null };
    }

    throw error;
  }
}
