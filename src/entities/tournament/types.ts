export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'rejected';

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'group_playoff' | 'swiss';

export type Tournament = {
  id: string;
  title: string;
  status: TournamentStatus;
  starts_at: string | null;
  ends_at?: string | null;
  club_id?: string | null;
  club_name?: string | null;
  club_city?: string | null;
  location: string | null;
  discipline: 'Москва' | 'Комби' | 'Америка' | 'Длинная америка' | 'Невка' | 'Колхоз';
  tournament_format: TournamentFormat;
  entry_fee_cents: number;
  currency: 'KZT';
  max_players?: number | null;
  banner_key?: string | null;
  registrations_count?: number | null;
  first_place_user_id?: string | null;
  second_place_user_id?: string | null;
  third_place_user_id?: string | null;
  third_place_second_user_id?: string | null;
  first_place_name?: string | null;
  second_place_name?: string | null;
  third_place_name?: string | null;
  third_place_second_name?: string | null;
};

export type TournamentRegistration = {
  id: string;
  tournamentId: string;
  userId: string;
  status: RegistrationStatus;
  seedNumber?: number;
};

export type TournamentMatch = {
  id: string;
  tournament_id: string;
  tournament_title?: string | null;
  player_a_id?: string | null;
  player_b_id?: string | null;
  winner_id?: string | null;
  next_match_id?: string | null;
  next_slot?: 'A' | 'B' | null;
  player_a_name?: string | null;
  player_b_name?: string | null;
  winner_name?: string | null;
  score?: string | null;
  round_name: string | null;
  round_number?: number | null;
  bracket_position?: number | null;
  status: MatchStatus;
  table_number?: number | null;
  scheduled_at?: string | null;
  stream_id?: string | null;
  stream_status?: string | null;
  stream_starts_at?: string | null;
  has_stream?: boolean | null;
  stream_title?: string | null;
  stream_has_video?: boolean | null;
};
