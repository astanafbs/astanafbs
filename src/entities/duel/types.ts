export type DuelStatus =
  | 'draft'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled';

export type Duel = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenger_name?: string | null;
  opponent_name?: string | null;
  status: DuelStatus;
  club_id?: string | null;
  club_name?: string | null;
  scheduled_at?: string | null;
  score?: string | null;
  winner_id?: string | null;
  rating_delta?: number | null;
};
