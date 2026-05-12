import { createDuel } from '../../entities/duel';

export async function submitDuelChallenge(input: {
  opponentId: string;
  clubId?: string;
  scheduledAt?: string;
}) {
  return createDuel(input);
}
