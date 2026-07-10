export type PlayerRole = 'user' | 'club_admin' | 'superadmin' | 'player' | 'club_owner' | 'organizer' | 'admin';

export type PlayerProfile = {
  id: string;
  userId?: string;
  displayName?: string;
  display_name: string;
  photo_url?: string | null;
  city?: string | null;
  role: PlayerRole;
  rating: number;
  rating_source: 'local' | 'bill4you';
  club_name?: string | null;
  skill_level?: string | null;
  profile_status_id?: string | null;
  profile_status_label?: string | null;
  profile_status_description?: string | null;
  titles?: string[];
  wins: number;
  losses: number;
  win_percentage?: number;
};

export type PlayerResult = {
  id: string;
  playerId: string;
  opponentName: string;
  score: string;
  result: 'win' | 'loss';
  playedAt: string;
};
