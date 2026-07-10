import { apiFetch } from '../../shared/lib/api';
import type { PlayerRole } from '../player/types';

export type UserEntitlement = {
  feature: 'app_access' | 'listing_publish' | 'stream_watch' | 'stream_create' | 'club_admin';
  starts_at: string;
  ends_at: string | null;
  status: string;
  active: boolean;
};

export type ClubMembership = {
  id: string;
  user_id: string;
  club_id: string;
  role: 'club_admin';
  status: string;
  club_name: string;
  club_city: string | null;
};

export type MeResponse = {
  user: {
    id: string;
    display_name: string;
    email?: string | null;
    role: PlayerRole;
    city?: string | null;
  };
  profile: {
    id: string;
    user_id: string;
    rating: number;
    rating_source: string;
    club_name?: string | null;
    skill_level?: string | null;
    profile_status_id?: string | null;
    profile_status_label?: string | null;
    profile_status_description?: string | null;
    titles?: string[];
    wins: number;
    losses: number;
  } | null;
  entitlements: UserEntitlement[];
  clubMemberships: ClubMembership[];
};

export function getMe() {
  return apiFetch<MeResponse>('/me');
}

export function updateMe(input: {
  displayName?: string;
  city?: string;
  clubName?: string;
  skillLevel?: string;
  profileStatusId?: string | null;
}) {
  return apiFetch<Pick<MeResponse, 'user' | 'profile'>>('/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function hasActiveEntitlement(me: MeResponse | null | undefined, feature: UserEntitlement['feature']) {
  return Boolean(me?.entitlements.some((entitlement) => entitlement.feature === feature && entitlement.active));
}
