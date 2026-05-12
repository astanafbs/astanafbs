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
  challengerId: string;
  opponentId: string;
  status: DuelStatus;
  clubId?: string;
  scheduledAt?: string;
  score?: string;
  winnerId?: string;
  ratingDelta?: number;
};
