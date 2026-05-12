import { registerForTournament } from '../../entities/tournament';

export async function submitTournamentRegistration(tournamentId: string) {
  return registerForTournament(tournamentId);
}
