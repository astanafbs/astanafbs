export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'rejected';

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export type Tournament = {
  id: string;
  title: string;
  status: TournamentStatus;
  startsAt: string;
  endsAt?: string;
  clubId?: string;
  location: string;
  entryFeeCents: number;
  currency: 'KZT';
  maxPlayers?: number;
  bannerKey?: string;
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
  tournamentId: string;
  playerAId?: string;
  playerBId?: string;
  winnerId?: string;
  score?: string;
  roundName: string;
  status: MatchStatus;
  scheduledAt?: string;
};
