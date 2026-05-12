export type PlayerRole = 'player' | 'club_owner' | 'organizer' | 'admin';

export type PlayerProfile = {
  id: string;
  userId: string;
  displayName: string;
  photoUrl?: string;
  city?: string;
  role: PlayerRole;
  rating: number;
  ratingSource: 'local' | 'bill4you';
  clubName?: string;
  skillLevel?: string;
  wins: number;
  losses: number;
};

export type PlayerResult = {
  id: string;
  playerId: string;
  opponentName: string;
  score: string;
  result: 'win' | 'loss';
  playedAt: string;
};
