import cors from '@fastify/cors';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { closeDb, db, query } from './db.js';
import { requireUser, upsertUser, verifyBearerToken } from './auth.js';
import { env } from './env.js';
import { createPresignedUploadUrl, getStorageObject } from './storage.js';

const app = Fastify({
  logger: {
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
  },
});
const dbId = z.string().regex(/^[0-9a-f-]{36}$/i);
const optionalDbId = dbId.nullish().transform((value) => value || null);
const optionalText = z.string().trim().nullish().transform((value) => value || null);
const optionalDate = z.string().trim().nullish().transform((value, ctx) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    ctx.addIssue({ code: 'custom', message: 'Invalid date' });
    return z.NEVER;
  }
  return date.toISOString();
});
const disciplineSchema = z.enum(['Москва', 'Комби', 'Америка', 'Длинная америка', 'Невка', 'Колхоз']);
const tournamentFormatSchema = z.enum(['single_elimination', 'double_elimination', 'round_robin', 'group_playoff', 'swiss']);
const userRoleSchema = z.enum(['user', 'club_admin', 'superadmin', 'player', 'club_owner', 'organizer', 'admin']);
const bracketSizeSchema = z.coerce.number().int().refine((value) => [16, 32, 64].includes(value), {
  message: 'Bracket size must be 16, 32, or 64',
});
const entitlementFeatureSchema = z.enum(['app_access', 'listing_publish', 'stream_watch', 'stream_create', 'club_admin']);
const optionalTextArray = z.array(z.string().trim().min(1)).optional();
const listingCategorySchema = z.enum(['coaches', 'cues', 'chalk', 'cases', 'tables', 'misc']);
const fileFolderSchema = z.enum(['avatars', 'banners', 'news', 'products', 'listings', 'clubs', 'tournaments']);
const uploadRequestSchema = z.object({
  folder: fileFolderSchema,
  filename: z.string().min(1),
  contentType: z.string().min(3),
});
const trainingDrillSchema = z.object({
  label: z.string().trim().min(2),
  made: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(1),
}).refine((drill) => drill.made <= drill.total, {
  message: 'made must be lower than or equal to total',
  path: ['made'],
});

type BracketSeedPlayer = {
  user_id: string;
  display_name: string;
  seed_number: number | null;
};

type GeneratedMatch = {
  id: string;
  tournamentId: string;
  roundNumber: number;
  bracketPosition: number;
  roundName: string;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  score: string | null;
  status: 'scheduled' | 'completed';
  nextMatchId: string | null;
  nextSlot: 'A' | 'B' | null;
};

function nextPowerOfTwo(value: number) {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

function seedOrder(size: number): number[] {
  if (size <= 1) return [1];
  const previous = seedOrder(size / 2);
  return previous.flatMap((seed, index) => {
    const pairedSeed = size + 1 - seed;
    return index % 2 === 0 ? [seed, pairedSeed] : [pairedSeed, seed];
  });
}

function roundLabel(roundNumber: number, totalRounds: number) {
  const remaining = totalRounds - roundNumber + 1;
  if (remaining === 1) return 'Финал';
  if (remaining === 2) return '1/2';
  return `1/${2 ** (remaining - 1)}`;
}

function buildSingleEliminationBracket(tournamentId: string, players: BracketSeedPlayer[], requestedBracketSize?: number | null) {
  const bracketSize = requestedBracketSize ?? nextPowerOfTwo(players.length);
  if (![16, 32, 64].includes(bracketSize)) {
    throw new Error('unsupported_bracket_size');
  }
  if (players.length > bracketSize) {
    throw new Error('too_many_players_for_bracket');
  }
  const totalRounds = Math.log2(bracketSize);
  const matchesByRound = Array.from({ length: totalRounds }, (_, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const matchCount = bracketSize / 2 ** roundNumber;
    return Array.from({ length: matchCount }, (_, bracketPosition): GeneratedMatch => ({
      id: randomUUID(),
      tournamentId,
      roundNumber,
      bracketPosition: bracketPosition + 1,
      roundName: roundLabel(roundNumber, totalRounds),
      playerAId: null,
      playerBId: null,
      winnerId: null,
      score: null,
      status: 'scheduled',
      nextMatchId: null,
      nextSlot: null,
    }));
  });

  matchesByRound.forEach((roundMatches, roundIndex) => {
    if (roundIndex === matchesByRound.length - 1) return;
    roundMatches.forEach((match, index) => {
      const nextMatch = matchesByRound[roundIndex + 1][Math.floor(index / 2)];
      match.nextMatchId = nextMatch.id;
      match.nextSlot = index % 2 === 0 ? 'A' : 'B';
    });
  });

  const slots = seedOrder(bracketSize).map((seed) => players[seed - 1] ?? null);
  matchesByRound[0].forEach((match, index) => {
    match.playerAId = slots[index * 2]?.user_id ?? null;
    match.playerBId = slots[index * 2 + 1]?.user_id ?? null;
  });

  for (let roundIndex = 0; roundIndex < matchesByRound.length; roundIndex += 1) {
    matchesByRound[roundIndex].forEach((match) => {
      const singlePlayerId = match.playerAId && !match.playerBId
        ? match.playerAId
        : !match.playerAId && match.playerBId
          ? match.playerBId
          : null;
      if (!singlePlayerId) return;

      match.winnerId = singlePlayerId;
      match.status = 'completed';
      match.score = 'BYE';

      if (!match.nextMatchId || !match.nextSlot) return;
      const nextMatch = matchesByRound[roundIndex + 1].find((item) => item.id === match.nextMatchId);
      if (!nextMatch) return;
      if (match.nextSlot === 'A') nextMatch.playerAId = singlePlayerId;
      if (match.nextSlot === 'B') nextMatch.playerBId = singlePlayerId;
    });
  }

  return matchesByRound.flat();
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers['x-admin-token'];
  const value = Array.isArray(token) ? token[0] : token;

  if (!env.adminApiToken || value !== env.adminApiToken) {
    reply.code(401).send({ error: 'admin_unauthorized', message: 'Admin token is required' });
    return false;
  }

  return true;
}

function isSuperadminRole(role?: string | null) {
  return role === 'superadmin' || role === 'admin';
}

function isClubAdminRole(role?: string | null) {
  return role === 'club_admin' || role === 'club_owner' || role === 'organizer' || isSuperadminRole(role);
}

async function getUserEntitlements(userId: string) {
  const result = await query(
    `
      SELECT feature, starts_at, ends_at, status,
             (status = 'active' AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())) AS active
      FROM user_entitlements
      WHERE user_id = $1
      ORDER BY feature ASC
    `,
    [userId],
  );
  return result.rows;
}

async function hasActiveEntitlement(userId: string, feature: z.infer<typeof entitlementFeatureSchema>) {
  const result = await query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM user_entitlements
        WHERE user_id = $1
          AND feature = $2
          AND status = 'active'
          AND starts_at <= now()
          AND (ends_at IS NULL OR ends_at > now())
      ) AS exists
    `,
    [userId, feature],
  );
  return Boolean(result.rows[0]?.exists);
}

async function upsertEntitlement(userId: string, feature: z.infer<typeof entitlementFeatureSchema>, endsAt: string | null) {
  if (!endsAt) return;
  await query(
    `
      INSERT INTO user_entitlements (user_id, feature, starts_at, ends_at, status)
      VALUES ($1, $2, now(), $3, 'active')
      ON CONFLICT (user_id, feature)
      DO UPDATE SET starts_at = now(),
                    ends_at = EXCLUDED.ends_at,
                    status = 'active',
                    updated_at = now()
    `,
    [userId, feature, endsAt],
  );
}

async function requireEntitlement(
  user: { id: string; role?: string | null },
  reply: FastifyReply,
  feature: z.infer<typeof entitlementFeatureSchema>,
) {
  if (isSuperadminRole(user.role)) return true;
  if (await hasActiveEntitlement(user.id, feature)) return true;
  reply.code(403).send({
    error: 'feature_unavailable',
    feature,
    message: 'Доступ к функции не активен или срок действия истек.',
  });
  return false;
}

type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function routeData(route: string, extra?: Record<string, unknown>) {
  return {
    source: 'billiardhub',
    route,
    ...extra,
  };
}

async function sendExpoPushMessages(tokens: string[], notification: PushNotificationPayload) {
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (!uniqueTokens.length) return 0;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        uniqueTokens.map((token) => ({
          to: token,
          title: notification.title,
          body: notification.body,
          sound: 'default',
          data: notification.data ?? {},
        })),
      ),
    });

    if (!response.ok) {
      const body = await response.text();
      app.log.warn(
        { statusCode: response.status, body: body.slice(0, 500) },
        'Expo push request failed',
      );
      return 0;
    }

    return uniqueTokens.length;
  } catch (error) {
    app.log.warn({ err: error }, 'Expo push request failed');
    return 0;
  }
}

async function notifyUsers(userIds: Array<string | null | undefined>, notification: PushNotificationPayload) {
  const ids = uniqueIds(userIds);
  if (!ids.length) return 0;

  const tokens = await query<{ expo_push_token: string }>(
    `
      SELECT DISTINCT expo_push_token
      FROM push_tokens
      WHERE enabled = TRUE
        AND user_id = ANY($1::uuid[])
      LIMIT 500
    `,
    [ids],
  );

  return sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), notification);
}

async function notifyAllEnabledUsers(notification: PushNotificationPayload) {
  const tokens = await query<{ expo_push_token: string }>(
    `
      SELECT DISTINCT p.expo_push_token
      FROM push_tokens p
      JOIN user_entitlements e ON e.user_id = p.user_id
      WHERE p.enabled = TRUE
        AND e.feature = 'app_access'
        AND e.status = 'active'
        AND e.starts_at <= now()
        AND (e.ends_at IS NULL OR e.ends_at > now())
      LIMIT 1000
    `,
  );

  return sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), notification);
}

async function notifyUsersWithFeature(
  feature: z.infer<typeof entitlementFeatureSchema>,
  notification: PushNotificationPayload,
) {
  const tokens = await query<{ expo_push_token: string }>(
    `
      SELECT DISTINCT p.expo_push_token
      FROM push_tokens p
      JOIN user_entitlements e ON e.user_id = p.user_id
      WHERE p.enabled = TRUE
        AND e.feature = $1
        AND e.status = 'active'
        AND e.starts_at <= now()
        AND (e.ends_at IS NULL OR e.ends_at > now())
      LIMIT 1000
    `,
    [feature],
  );

  return sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), notification);
}

async function notifyClubAdmins(clubId: string | null | undefined, notification: PushNotificationPayload) {
  if (!clubId) return 0;

  const tokens = await query<{ expo_push_token: string }>(
    `
      SELECT DISTINCT p.expo_push_token
      FROM club_memberships cm
      JOIN push_tokens p ON p.user_id = cm.user_id
      WHERE cm.club_id = $1
        AND cm.status = 'active'
        AND p.enabled = TRUE
      LIMIT 200
    `,
    [clubId],
  );

  return sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), notification);
}

async function notifySuperadmins(notification: PushNotificationPayload) {
  const tokens = await query<{ expo_push_token: string }>(
    `
      SELECT DISTINCT p.expo_push_token
      FROM push_tokens p
      JOIN users u ON u.id = p.user_id
      WHERE p.enabled = TRUE
        AND u.role IN ('superadmin', 'admin')
      LIMIT 200
    `,
  );

  return sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), notification);
}

function registrationStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: 'на рассмотрении',
    confirmed: 'подтверждена',
    waitlist: 'в листе ожидания',
    cancelled: 'отменена',
    rejected: 'отклонена',
  };
  return labels[status ?? ''] ?? status ?? 'обновлена';
}

function matchStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    scheduled: 'запланирован',
    live: 'начался',
    completed: 'завершен',
    cancelled: 'отменен',
  };
  return labels[status ?? ''] ?? status ?? 'обновлен';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildYouTubeEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '1',
    enablejsapi: '1',
    origin: 'https://billiardhub.app',
    widget_referrer: 'https://billiardhub.app',
  });

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function buildYouTubePlayerHtml(videoId: string, title: string) {
  const embedUrl = buildYouTubeEmbedUrl(videoId);
  const escapedTitle = escapeHtml(title);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body, #player { margin: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe { display: block; width: 100%; height: 100%; border: 0; background: #000; }
    </style>
  </head>
  <body>
    <iframe
      id="player"
      title="${escapedTitle}"
      src="${embedUrl}"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}

type ClubMembershipRow = {
  club_id: string;
  club_name: string;
  club_city: string | null;
  [key: string]: unknown;
};

async function getClubMemberships(userId: string) {
  const result = await query<ClubMembershipRow>(
    `
      SELECT cm.*, c.name AS club_name, c.city AS club_city
      FROM club_memberships cm
      JOIN clubs c ON c.id = cm.club_id
      WHERE cm.user_id = $1 AND cm.status = 'active'
      ORDER BY c.name ASC
    `,
    [userId],
  );
  return result.rows;
}

async function requireClubAdmin(request: FastifyRequest, reply: FastifyReply, clubId?: string | null) {
  const user = await requireUser(request, reply);
  if (!user) return null;
  if (!isClubAdminRole(user.role)) {
    reply.code(403).send({ error: 'club_admin_required', message: 'Нужны права администратора клуба.' });
    return null;
  }
  if (!(await requireEntitlement(user, reply, 'app_access'))) return null;
  if (!(await requireEntitlement(user, reply, 'club_admin'))) return null;

  const memberships = await getClubMemberships(user.id);
  if (isSuperadminRole(user.role)) {
    return { user, memberships };
  }

  if (!memberships.length) {
    reply.code(403).send({ error: 'club_membership_required', message: 'Пользователь не привязан к клубу.' });
    return null;
  }

  if (clubId && !memberships.some((membership) => membership.club_id === clubId)) {
    reply.code(403).send({ error: 'club_forbidden', message: 'Можно управлять только своим клубом.' });
    return null;
  }

  return { user, memberships };
}

function membershipClubIds(auth: { user: { role?: string | null }; memberships: Array<{ club_id: string }> }) {
  if (isSuperadminRole(auth.user.role)) return null;
  return auth.memberships.map((membership) => membership.club_id);
}

async function generateSingleEliminationForTournament(tournamentId: string) {
  const tournament = await query(
    'SELECT title, tournament_format, max_players FROM tournaments WHERE id = $1',
    [tournamentId],
  );
  if (!tournament.rows[0]) {
    return { statusCode: 404, error: 'not_found', message: 'Турнир не найден.' };
  }
  if (tournament.rows[0].tournament_format !== 'single_elimination') {
    return {
      statusCode: 409,
      error: 'unsupported_tournament_format',
      message: 'Автогенератор сейчас поддерживает только олимпийскую сетку.',
    };
  }

  const activeMatches = await query(
    `
      SELECT count(*)::int AS count
      FROM matches
      WHERE tournament_id = $1
        AND (
          status = 'live'
          OR (status = 'completed' AND COALESCE(score, '') <> 'BYE')
        )
    `,
    [tournamentId],
  );
  if (Number(activeMatches.rows[0]?.count ?? 0) > 0) {
    return {
      statusCode: 409,
      error: 'bracket_locked',
      message: 'Нельзя пересобрать сетку, если уже есть live/completed матчи.',
    };
  }

  const players = await query<BracketSeedPlayer>(
    `
      SELECT r.user_id, u.display_name, r.seed_number
      FROM tournament_registrations r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN player_profiles p ON p.user_id = u.id
      WHERE r.tournament_id = $1 AND r.status = 'confirmed'
      ORDER BY COALESCE(r.seed_number, 9999) ASC, COALESCE(p.rating, 0) DESC, u.display_name ASC
    `,
    [tournamentId],
  );

  if (players.rows.length < 2) {
    return {
      statusCode: 409,
      error: 'not_enough_players',
      message: 'Для сетки нужно минимум 2 подтвержденных участника.',
    };
  }

  const bracketSize = Number(tournament.rows[0].max_players ?? 16);
  if (players.rows.length > bracketSize) {
    return {
      statusCode: 409,
      error: 'too_many_players_for_bracket',
      message: 'Количество подтвержденных игроков больше размера сетки.',
    };
  }

  const generatedMatches = buildSingleEliminationBracket(tournamentId, players.rows, bracketSize);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM matches WHERE tournament_id = $1', [tournamentId]);

    for (const match of [...generatedMatches].sort((a, b) => b.roundNumber - a.roundNumber || a.bracketPosition - b.bracketPosition)) {
      await client.query(
        `
          INSERT INTO matches (
            id,
            tournament_id,
            player_a_id,
            player_b_id,
            winner_id,
            next_match_id,
            next_slot,
            score,
            round_name,
            round_number,
            bracket_position,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          match.id,
          match.tournamentId,
          match.playerAId,
          match.playerBId,
          match.winnerId,
          match.nextMatchId,
          match.nextSlot,
          match.score,
          match.roundName,
          match.roundNumber,
          match.bracketPosition,
          match.status,
        ],
      );
    }

    await client.query(
      `
        UPDATE tournaments
        SET status = CASE
            WHEN status = 'registration_open' THEN 'registration_closed'::tournament_status
            ELSE status
          END,
          updated_at = now()
        WHERE id = $1
      `,
      [tournamentId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await notifyUsers(players.rows.map((player) => player.user_id), {
    title: 'Сетка турнира готова',
    body: tournament.rows[0].title,
    data: routeData(`/tournaments/${tournamentId}/bracket`, {
      type: 'tournament_bracket_ready',
      tournamentId,
    }),
  });

  return {
    data: {
      bracket_size: bracketSize,
      players_count: players.rows.length,
      matches_count: generatedMatches.length,
    },
  };
}

await app.register(cors, {
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
  credentials: true,
});

app.get('/health', async () => {
  await query('select 1');
  return { ok: true, service: 'fbs-astana-api' };
});

app.post('/auth/firebase', async (request, reply) => {
  const identityFromToken = await verifyBearerToken(request);
  const bodySchema = z.object({
    firebaseUid: z.string().min(1).optional(),
    email: z.string().email().optional(),
    displayName: z.string().min(1).optional(),
    photoUrl: z.string().url().optional(),
  });
  const body = bodySchema.parse(request.body ?? {});

  if (!identityFromToken && !body.firebaseUid) {
    return reply.code(401).send({ error: 'unauthorized', message: 'Firebase token is required' });
  }

  const identity = identityFromToken ?? {
    firebaseUid: body.firebaseUid!,
    email: body.email,
    displayName: body.displayName,
    photoUrl: body.photoUrl,
  };

  const user = await upsertUser(identity);
  return { user };
});

app.get('/me', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const [profile, entitlements, memberships] = await Promise.all([
    query(
      `
        SELECT p.*, ps.label AS profile_status_label, ps.description AS profile_status_description
        FROM player_profiles p
        LEFT JOIN profile_statuses ps ON ps.id = p.profile_status_id
        WHERE p.user_id = $1
        LIMIT 1
      `,
      [user.id],
    ),
    getUserEntitlements(user.id),
    getClubMemberships(user.id),
  ]);

  return {
    user,
    profile: profile.rows[0] ?? null,
    entitlements,
    clubMemberships: memberships,
  };
});

app.patch('/me', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const schema = z.object({
    displayName: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    clubName: z.string().min(2).optional(),
    skillLevel: z.string().min(2).optional(),
    profileStatusId: optionalDbId,
  });
  const body = schema.parse(request.body);

  const updatedUser = await query(
    `
      UPDATE users
      SET display_name = COALESCE($2, display_name),
          city = COALESCE($3, city),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [user.id, body.displayName ?? null, body.city ?? null],
  );

  const updatedProfile = await query(
    `
      UPDATE player_profiles
      SET club_name = COALESCE($2, club_name),
          skill_level = COALESCE($3, skill_level),
          profile_status_id = COALESCE($4, profile_status_id),
          updated_at = now()
      WHERE user_id = $1
      RETURNING *
    `,
    [user.id, body.clubName ?? null, body.skillLevel ?? null, body.profileStatusId],
  );

  return { user: updatedUser.rows[0], profile: updatedProfile.rows[0] ?? null };
});

app.get('/news', async () => {
  const result = await query(
    `
      SELECT id, title, body, image_key, status, published_at, created_at
      FROM news_posts
      WHERE status = 'published'
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT 50
    `,
  );
  return { data: result.rows };
});

app.get('/news/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT id, title, body, image_key, status, published_at, created_at
      FROM news_posts
      WHERE id = $1 AND status = 'published'
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/clubs', async () => {
  const result = await query('SELECT * FROM clubs ORDER BY name ASC LIMIT 100');
  return { data: result.rows };
});

app.get('/clubs/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query('SELECT * FROM clubs WHERE id = $1 LIMIT 1', [params.data.id]);
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/streams', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'stream_watch'))) return;

  const result = await query(
    `
      SELECT s.id, s.title, s.status, s.starts_at, s.match_id,
             m.tournament_id, m.round_name, m.round_number, m.bracket_position,
             t.title AS tournament_title, player_a.display_name AS player_a_name,
             player_b.display_name AS player_b_name,
             TRUE AS has_player
      FROM streams s
      LEFT JOIN matches m ON m.id = s.match_id
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      WHERE s.status = 'published'
        AND s.youtube_video_id IS NOT NULL
        AND length(trim(s.youtube_video_id)) > 0
      ORDER BY COALESCE(s.starts_at, s.created_at) DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/streams/:id', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'stream_watch'))) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT s.id, s.title, s.status, s.starts_at, s.match_id,
             m.tournament_id, m.round_name, m.round_number, m.bracket_position,
             t.title AS tournament_title, player_a.display_name AS player_a_name,
             player_b.display_name AS player_b_name,
             TRUE AS has_player
      FROM streams s
      LEFT JOIN matches m ON m.id = s.match_id
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      WHERE s.id = $1
        AND s.status = 'published'
        AND s.youtube_video_id IS NOT NULL
        AND length(trim(s.youtube_video_id)) > 0
      LIMIT 1
    `,
    [params.data.id],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/streams/:id/player', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'stream_watch'))) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query<{ title: string; youtube_video_id: string }>(
    `
      SELECT title, youtube_video_id
      FROM streams
      WHERE id = $1
        AND status = 'published'
        AND youtube_video_id IS NOT NULL
        AND length(trim(youtube_video_id)) > 0
      LIMIT 1
    `,
    [params.data.id],
  );
  const stream = result.rows[0];
  if (!stream) return reply.code(404).send({ error: 'not_found' });

  reply
    .type('text/html; charset=utf-8')
    .header('cache-control', 'private, no-store')
    .header('x-robots-tag', 'noindex, nofollow');

  return reply.send(buildYouTubePlayerHtml(stream.youtube_video_id, stream.title));
});

app.get('/matches/:id/stream', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'stream_watch'))) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT s.id, s.title, s.status, s.starts_at, s.match_id,
             m.tournament_id, m.round_name, m.round_number, m.bracket_position,
             t.title AS tournament_title, player_a.display_name AS player_a_name,
             player_b.display_name AS player_b_name,
             TRUE AS has_player
      FROM streams s
      JOIN matches m ON m.id = s.match_id
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      WHERE s.match_id = $1
        AND s.status = 'published'
        AND s.youtube_video_id IS NOT NULL
        AND length(trim(s.youtube_video_id)) > 0
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/listings', async () => {
  const result = await query(
    `
      SELECT l.*, u.display_name AS user_name, u.email AS user_email
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.status = 'published'
        AND (l.published_until IS NULL OR l.published_until > now())
      ORDER BY l.created_at DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/listings/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT l.*, u.display_name AS user_name, u.email AS user_email
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.id = $1 AND l.status = 'published'
        AND (l.published_until IS NULL OR l.published_until > now())
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.post('/listings', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'app_access'))) return;
  if (!(await requireEntitlement(user, reply, 'listing_publish'))) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    description: optionalText,
    category: listingCategorySchema.default('misc'),
    priceCents: z.coerce.number().int().min(0).optional(),
    currency: z.string().trim().default('KZT'),
    imageKeys: z.array(z.string().trim().min(1)).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO listings (
        user_id, title, description, category, price_cents, currency, status, image_keys, published_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'moderation', COALESCE($7::text[], '{}'), now() + interval '7 days')
      RETURNING *
    `,
    [
      user.id,
      body.title,
      body.description,
      body.category,
      body.priceCents ?? null,
      body.currency,
      body.imageKeys ?? null,
    ],
  );

  await notifySuperadmins({
    title: 'Новое объявление на модерации',
    body: body.title,
    data: routeData('/listings', {
      type: 'listing_moderation_requested',
      listingId: result.rows[0].id,
    }),
  });

  return { data: result.rows[0] };
});

app.get('/products', async () => {
  const result = await query(
    `
      SELECT *
      FROM products
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/products/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT *
      FROM products
      WHERE id = $1 AND status = 'published'
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/training/templates', async () => {
  const result = await query(
    `
      SELECT *
      FROM training_templates
      WHERE status = 'published'
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/training/metrics', async () => {
  const result = await query(
    `
      SELECT *
      FROM training_metrics
      WHERE status = 'published'
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/profile-statuses', async () => {
  const result = await query(
    `
      SELECT id, label, description, sort_order
      FROM profile_statuses
      WHERE status = 'published'
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/training/sessions', async () => {
  const result = await query(
    `
      SELECT s.*, t.title AS template_title
      FROM training_sessions s
      LEFT JOIN training_templates t ON t.id = s.template_id
      ORDER BY s.trained_at DESC, s.created_at DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.post('/training/sessions', async (request) => {
  const schema = z.object({
    templateId: optionalDbId,
    playerName: z.string().trim().min(2).default('Игрок BilliardHUB'),
    title: z.string().trim().min(2),
    discipline: z.string().trim().min(2).default('Пирамида'),
    focus: optionalText,
    durationMinutes: z.coerce.number().int().min(10).max(480),
    drills: z.array(trainingDrillSchema).min(1).max(12),
    moodScore: z.coerce.number().int().min(1).max(10).default(7),
    notes: optionalText,
    trainedAt: optionalDate,
  });
  const body = schema.parse(request.body ?? {});
  const result = await query(
    `
      INSERT INTO training_sessions (
        template_id,
        player_name,
        title,
        discipline,
        focus,
        duration_minutes,
        drills,
        mood_score,
        notes,
        trained_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, COALESCE($10::timestamptz, now()))
      RETURNING *
    `,
    [
      body.templateId,
      body.playerName,
      body.title,
      body.discipline,
      body.focus,
      body.durationMinutes,
      JSON.stringify(body.drills),
      body.moodScore,
      body.notes,
      body.trainedAt,
    ],
  );
  return { data: result.rows[0] };
});

app.get('/tournaments', async () => {
  const result = await query(
    `
      SELECT t.*, c.name AS club_name, c.city AS club_city,
             (SELECT count(*)::int FROM tournament_registrations r WHERE r.tournament_id = t.id) AS registrations_count,
             first_place.display_name AS first_place_name,
             second_place.display_name AS second_place_name,
             third_place.display_name AS third_place_name,
             third_place_second.display_name AS third_place_second_name
      FROM tournaments t
      LEFT JOIN clubs c ON c.id = t.club_id
      LEFT JOIN users first_place ON first_place.id = t.first_place_user_id
      LEFT JOIN users second_place ON second_place.id = t.second_place_user_id
      LEFT JOIN users third_place ON third_place.id = t.third_place_user_id
      LEFT JOIN users third_place_second ON third_place_second.id = t.third_place_second_user_id
      WHERE t.status IN ('registration_open', 'registration_closed', 'in_progress', 'completed')
      ORDER BY COALESCE(t.starts_at, t.created_at) ASC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/tournaments/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT t.*, c.name AS club_name, c.city AS club_city,
             (SELECT count(*)::int FROM tournament_registrations r WHERE r.tournament_id = t.id) AS registrations_count,
             first_place.display_name AS first_place_name,
             second_place.display_name AS second_place_name,
             third_place.display_name AS third_place_name,
             third_place_second.display_name AS third_place_second_name
      FROM tournaments t
      LEFT JOIN clubs c ON c.id = t.club_id
      LEFT JOIN users first_place ON first_place.id = t.first_place_user_id
      LEFT JOIN users second_place ON second_place.id = t.second_place_user_id
      LEFT JOIN users third_place ON third_place.id = t.third_place_user_id
      LEFT JOIN users third_place_second ON third_place_second.id = t.third_place_second_user_id
      WHERE t.id = $1
        AND t.status IN ('registration_open', 'registration_closed', 'in_progress', 'completed')
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.post('/tournaments/:id/register', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'app_access'))) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const tournament = await query(
    'select id, title, club_id, status, max_players from tournaments where id = $1',
    [params.data.id],
  );
  const tournamentRow = tournament.rows[0];

  if (!tournamentRow) return reply.code(404).send({ error: 'not_found' });
  if (tournamentRow.status !== 'registration_open') {
    return reply.code(409).send({ error: 'registration_closed' });
  }

  const existingRegistration = await query(
    'SELECT * FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2 LIMIT 1',
    [params.data.id, user.id],
  );
  if (existingRegistration.rows[0]) {
    return { data: existingRegistration.rows[0] };
  }

  if (tournamentRow.max_players) {
    const count = await query<{ count: string }>(
      `
        SELECT count(*)::text
        FROM tournament_registrations
        WHERE tournament_id = $1 AND status IN ('pending', 'confirmed')
      `,
      [params.data.id],
    );
    if (Number(count.rows[0]?.count ?? 0) >= Number(tournamentRow.max_players)) {
      return reply.code(409).send({ error: 'tournament_full' });
    }
  }

  const registration = await query(
    `
      INSERT INTO tournament_registrations (tournament_id, user_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `,
    [params.data.id, user.id],
  );

  await notifyUsers([user.id], {
    title: 'Заявка отправлена',
    body: tournamentRow.title,
    data: routeData(`/tournaments/${params.data.id}`, {
      type: 'tournament_registration_created',
      tournamentId: params.data.id,
      registrationId: registration.rows[0].id,
    }),
  });

  const adminNotification = {
    title: 'Новая заявка на турнир',
    body: `${user.display_name} · ${tournamentRow.title}`,
    data: routeData(`/tournaments/${params.data.id}`, {
      type: 'tournament_registration_admin',
      tournamentId: params.data.id,
      registrationId: registration.rows[0].id,
    }),
  };
  const notifiedClubAdmins = await notifyClubAdmins(tournamentRow.club_id, adminNotification);
  if (!notifiedClubAdmins) {
    await notifySuperadmins(adminNotification);
  }

  return { data: registration.rows[0] };
});

app.get('/tournaments/:id/players', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT r.id AS registration_id, r.status, r.seed_number, u.id, u.display_name, u.photo_url, u.city,
             p.rating, p.club_name
      FROM tournament_registrations r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN player_profiles p ON p.user_id = u.id
      WHERE r.tournament_id = $1
      ORDER BY r.seed_number NULLS LAST, p.rating DESC
    `,
    [params.data.id],
  );

  return { data: result.rows };
});

app.get('/tournaments/:id/matches', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT m.*, player_a.display_name AS player_a_name, player_b.display_name AS player_b_name,
             winner.display_name AS winner_name,
             s.id AS stream_id, s.status AS stream_status, s.starts_at AS stream_starts_at,
             (s.id IS NOT NULL AND s.status = 'published' AND s.youtube_video_id IS NOT NULL AND length(trim(s.youtube_video_id)) > 0) AS has_stream
      FROM matches m
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      LEFT JOIN users winner ON winner.id = m.winner_id
      LEFT JOIN streams s ON s.match_id = m.id
      WHERE m.tournament_id = $1
      ORDER BY m.round_number ASC, m.bracket_position ASC, COALESCE(m.scheduled_at, m.created_at) ASC
    `,
    [params.data.id],
  );

  return { data: result.rows };
});

app.get('/ratings/cities', async () => {
  const result = await query(
    `
      SELECT u.city, count(*)::int AS players_count
      FROM player_profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.city IS NOT NULL AND length(trim(u.city)) > 0
      GROUP BY u.city
      ORDER BY u.city ASC
    `,
  );
  return { data: result.rows };
});

app.get('/ratings', async (request, reply) => {
  const queryParams = z.object({
    city: z.string().trim().min(1).optional(),
  }).safeParse(request.query);
  if (!queryParams.success) return reply.code(400).send({ error: 'bad_request' });

  const city = queryParams.data.city;
  const result = await query(
    `
      SELECT u.id, u.display_name, u.photo_url, u.city, p.rating, p.rating_source, p.club_name,
             p.skill_level, p.profile_status_id, ps.label AS profile_status_label,
             ps.description AS profile_status_description, p.titles, p.wins, p.losses,
             CASE
               WHEN (p.wins + p.losses) > 0 THEN round((p.wins::numeric / (p.wins + p.losses)) * 100, 1)
               ELSE 0
             END AS win_percentage
      FROM player_profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_statuses ps ON ps.id = p.profile_status_id
      WHERE ($1::text IS NULL OR lower(u.city) = lower($1::text))
      ORDER BY p.rating DESC, p.wins DESC
      LIMIT 100
    `,
    [city ?? null],
  );
  return { data: result.rows };
});

app.get('/players/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT u.id, u.display_name, u.photo_url, u.city, p.rating, p.rating_source,
             p.club_name, p.skill_level, p.profile_status_id, ps.label AS profile_status_label,
             ps.description AS profile_status_description, p.titles, p.wins, p.losses,
             CASE
               WHEN (p.wins + p.losses) > 0 THEN round((p.wins::numeric / (p.wins + p.losses)) * 100, 1)
               ELSE 0
             END AS win_percentage
      FROM users u
      LEFT JOIN player_profiles p ON p.user_id = u.id
      LEFT JOIN profile_statuses ps ON ps.id = p.profile_status_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [params.data.id],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/duels', async () => {
  const result = await query(
    `
      SELECT d.*, challenger.display_name AS challenger_name, opponent.display_name AS opponent_name,
             c.name AS club_name
      FROM duels d
      LEFT JOIN users challenger ON challenger.id = d.challenger_id
      LEFT JOIN users opponent ON opponent.id = d.opponent_id
      LEFT JOIN clubs c ON c.id = d.club_id
      ORDER BY COALESCE(d.scheduled_at, d.created_at) DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.post('/duels', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (!(await requireEntitlement(user, reply, 'app_access'))) return;

  const schema = z.object({
    opponentId: dbId,
    clubId: dbId.optional(),
    scheduledAt: z.string().datetime().optional(),
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      INSERT INTO duels (challenger_id, opponent_id, club_id, scheduled_at, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `,
    [user.id, body.opponentId, body.clubId ?? null, body.scheduledAt ?? null],
  );

  await notifyUsers([body.opponentId], {
    title: 'Новый вызов на дуэль',
    body: `${user.display_name} хочет сыграть с вами`,
    data: routeData('/duels', {
      type: 'duel_created',
      duelId: result.rows[0].id,
    }),
  });

  return { data: result.rows[0] };
});

app.post('/push-tokens', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const schema = z.object({
    expoPushToken: z.string().min(10),
    platform: z.string().optional(),
    enabled: z.boolean().optional(),
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      INSERT INTO push_tokens (user_id, expo_push_token, platform, enabled)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (expo_push_token)
      DO UPDATE SET user_id = EXCLUDED.user_id,
                    platform = EXCLUDED.platform,
                    enabled = EXCLUDED.enabled,
                    updated_at = now()
      RETURNING *
    `,
    [user.id, body.expoPushToken, body.platform ?? null, body.enabled ?? true],
  );

  return { data: result.rows[0] };
});

app.post('/files/presign-upload', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const body = uploadRequestSchema.parse(request.body);
  return { data: await createPresignedUploadUrl(body) };
});

app.get('/files/*', async (request, reply) => {
  const params = z.object({ '*': z.string().min(1) }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  try {
    const object = await getStorageObject(decodeURIComponent(params.data['*']));
    if (object.ContentType) reply.type(object.ContentType);
    if (object.ETag) reply.header('etag', object.ETag);
    if (object.ContentLength) reply.header('content-length', String(object.ContentLength));
    return reply.send(object.Body);
  } catch {
    return reply.code(404).send({ error: 'not_found' });
  }
});

app.get('/club-admin/overview', async (request, reply) => {
  const auth = await requireClubAdmin(request, reply);
  if (!auth) return;
  const clubIds = membershipClubIds(auth);
  const params = [clubIds];
  const [tournaments, matches, registrations] = await Promise.all([
    query(
      `
        SELECT t.*, c.name AS club_name, c.city AS club_city,
               (SELECT count(*)::int FROM tournament_registrations r WHERE r.tournament_id = t.id) AS registrations_count
        FROM tournaments t
        LEFT JOIN clubs c ON c.id = t.club_id
        WHERE ($1::uuid[] IS NULL OR t.club_id = ANY($1::uuid[]))
        ORDER BY COALESCE(t.starts_at, t.created_at) DESC
        LIMIT 100
      `,
      params,
    ),
    query(
      `
        SELECT m.*, t.title AS tournament_title, t.club_id,
               player_a.display_name AS player_a_name, player_b.display_name AS player_b_name,
               winner.display_name AS winner_name,
               s.id AS stream_id, s.title AS stream_title, s.status AS stream_status,
               (s.youtube_video_id IS NOT NULL AND length(trim(s.youtube_video_id)) > 0) AS stream_has_video
        FROM matches m
        JOIN tournaments t ON t.id = m.tournament_id
        LEFT JOIN users player_a ON player_a.id = m.player_a_id
        LEFT JOIN users player_b ON player_b.id = m.player_b_id
        LEFT JOIN users winner ON winner.id = m.winner_id
        LEFT JOIN streams s ON s.match_id = m.id
        WHERE ($1::uuid[] IS NULL OR t.club_id = ANY($1::uuid[]))
        ORDER BY COALESCE(m.scheduled_at, m.created_at) DESC
        LIMIT 200
      `,
      params,
    ),
    query(
      `
        SELECT r.*, t.title AS tournament_title, t.club_id, u.display_name AS user_name, p.rating, p.club_name
        FROM tournament_registrations r
        JOIN tournaments t ON t.id = r.tournament_id
        JOIN users u ON u.id = r.user_id
        LEFT JOIN player_profiles p ON p.user_id = u.id
        WHERE ($1::uuid[] IS NULL OR t.club_id = ANY($1::uuid[]))
        ORDER BY r.created_at DESC
        LIMIT 200
      `,
      params,
    ),
  ]);

  return {
    data: {
      clubs: auth.memberships,
      tournaments: tournaments.rows,
      matches: matches.rows,
      registrations: registrations.rows,
    },
  };
});

app.post('/club-admin/tournaments', async (request, reply) => {
  const schema = z.object({
    clubId: dbId,
    title: z.string().trim().min(2),
    status: z.enum(['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled']).default('draft'),
    startsAt: optionalDate,
    location: optionalText,
    discipline: disciplineSchema.default('Москва'),
    maxPlayers: bracketSizeSchema.default(16),
    entryFeeCents: z.coerce.number().int().min(0).default(0),
  });
  const body = schema.parse(request.body);
  const auth = await requireClubAdmin(request, reply, body.clubId);
  if (!auth) return;

  const result = await query(
    `
      INSERT INTO tournaments (
        title, status, starts_at, club_id, location, discipline, tournament_format,
        entry_fee_cents, currency, max_players
      )
      VALUES ($1, $2::tournament_status, $3, $4, $5, $6, 'single_elimination', $7, 'KZT', $8)
      RETURNING *
    `,
    [
      body.title,
      body.status,
      body.startsAt,
      body.clubId,
      body.location,
      body.discipline,
      body.entryFeeCents,
      body.maxPlayers,
    ],
  );

  if (result.rows[0].status === 'registration_open') {
    await notifyAllEnabledUsers({
      title: 'Открыта регистрация на турнир',
      body: result.rows[0].title,
      data: routeData(`/tournaments/${result.rows[0].id}`, {
        type: 'tournament_registration_open',
        tournamentId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/club-admin/tournaments/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const current = await query('SELECT id, title, status, club_id FROM tournaments WHERE id = $1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });
  const auth = await requireClubAdmin(request, reply, current.rows[0].club_id);
  if (!auth) return;

  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    status: z.enum(['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled']).optional(),
    startsAt: optionalDate,
    location: optionalText,
    discipline: disciplineSchema.optional(),
    maxPlayers: bracketSizeSchema.optional(),
    entryFeeCents: z.coerce.number().int().min(0).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE tournaments
      SET title = COALESCE($2, title),
          status = COALESCE($3::tournament_status, status),
          starts_at = COALESCE($4, starts_at),
          location = COALESCE($5, location),
          discipline = COALESCE($6, discipline),
          max_players = COALESCE($7, max_players),
          entry_fee_cents = COALESCE($8, entry_fee_cents),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      params.data.id,
      body.title ?? null,
      body.status ?? null,
      body.startsAt,
      body.location,
      body.discipline ?? null,
      body.maxPlayers ?? null,
      body.entryFeeCents ?? null,
    ],
  );

  if (result.rows[0].status === 'registration_open' && current.rows[0].status !== 'registration_open') {
    await notifyAllEnabledUsers({
      title: 'Открыта регистрация на турнир',
      body: result.rows[0].title,
      data: routeData(`/tournaments/${result.rows[0].id}`, {
        type: 'tournament_registration_open',
        tournamentId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/club-admin/registrations/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const current = await query(
    `
      SELECT r.id, r.user_id, r.status, r.tournament_id, t.club_id, t.title AS tournament_title
      FROM tournament_registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.id = $1
    `,
    [params.data.id],
  );
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });
  const auth = await requireClubAdmin(request, reply, current.rows[0].club_id);
  if (!auth) return;

  const schema = z.object({
    status: z.enum(['pending', 'confirmed', 'waitlist', 'cancelled', 'rejected']).optional(),
    seedNumber: z.coerce.number().int().min(1).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE tournament_registrations
      SET status = COALESCE($2::registration_status, status),
          seed_number = COALESCE($3, seed_number)
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.status ?? null, body.seedNumber ?? null],
  );

  if (body.status && result.rows[0].status !== current.rows[0].status) {
    await notifyUsers([current.rows[0].user_id], {
      title: 'Статус заявки обновлен',
      body: `${current.rows[0].tournament_title}: ${registrationStatusLabel(result.rows[0].status)}`,
      data: routeData(`/tournaments/${current.rows[0].tournament_id}`, {
        type: 'tournament_registration_status',
        tournamentId: current.rows[0].tournament_id,
        registrationId: result.rows[0].id,
        status: result.rows[0].status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.post('/club-admin/tournaments/:id/generate-bracket', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const current = await query('SELECT club_id FROM tournaments WHERE id = $1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });
  const auth = await requireClubAdmin(request, reply, current.rows[0].club_id);
  if (!auth) return;

  const result = await generateSingleEliminationForTournament(params.data.id);
  if ('error' in result) return reply.code(result.statusCode ?? 409).send({ error: result.error, message: result.message });
  return result;
});

app.patch('/club-admin/matches/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const current = await query(
    `
      SELECT m.id, m.player_a_id, m.player_b_id, m.status, m.score, m.table_number,
             m.scheduled_at, t.club_id, t.title AS tournament_title
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = $1
    `,
    [params.data.id],
  );
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });
  const auth = await requireClubAdmin(request, reply, current.rows[0].club_id);
  if (!auth) return;

  const schema = z.object({
    score: optionalText,
    status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
    winnerId: optionalDbId,
    tableNumber: z.coerce.number().int().min(1).optional(),
    scheduledAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE matches
      SET score = COALESCE($2, score),
          status = COALESCE($3::match_status, status),
          winner_id = COALESCE($4, winner_id),
          table_number = COALESCE($5, table_number),
          scheduled_at = COALESCE($6, scheduled_at),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.score, body.status ?? null, body.winnerId, body.tableNumber ?? null, body.scheduledAt],
  );
  const updatedMatch = result.rows[0] as {
    id: string;
    tournament_id: string;
    player_a_id: string | null;
    player_b_id: string | null;
    score: string | null;
    status: string;
    table_number: number | null;
    winner_id: string | null;
    next_match_id: string | null;
    next_slot: 'A' | 'B' | null;
  };
  if (updatedMatch.status === 'completed' && updatedMatch.winner_id && updatedMatch.next_match_id && updatedMatch.next_slot) {
    await query(
      `
        UPDATE matches
        SET player_a_id = CASE WHEN $3 = 'A' THEN $2 ELSE player_a_id END,
            player_b_id = CASE WHEN $3 = 'B' THEN $2 ELSE player_b_id END,
            updated_at = now()
        WHERE id = $1
      `,
      [updatedMatch.next_match_id, updatedMatch.winner_id, updatedMatch.next_slot],
    );
  }

  const shouldNotifyPlayers = Boolean(body.score || body.status || body.winnerId || body.tableNumber || body.scheduledAt);
  if (shouldNotifyPlayers) {
    await notifyUsers([updatedMatch.player_a_id, updatedMatch.player_b_id], {
      title: updatedMatch.status === 'live'
        ? 'Матч начался'
        : updatedMatch.status === 'completed'
          ? 'Матч завершен'
          : 'Матч обновлен',
      body: `${current.rows[0].tournament_title}: ${matchStatusLabel(updatedMatch.status)}${updatedMatch.score ? ` · ${updatedMatch.score}` : ''}${updatedMatch.table_number ? ` · стол ${updatedMatch.table_number}` : ''}`,
      data: routeData(`/tournaments/${updatedMatch.tournament_id}/matches/${updatedMatch.id}`, {
        type: 'match_updated',
        matchId: updatedMatch.id,
        tournamentId: updatedMatch.tournament_id,
        status: updatedMatch.status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.post('/club-admin/matches/:id/stream', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const current = await query(
    `
      SELECT m.id, t.club_id, t.title AS tournament_title, m.round_name
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = $1
    `,
    [params.data.id],
  );
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });
  const auth = await requireClubAdmin(request, reply, current.rows[0].club_id);
  if (!auth) return;
  if (!(await requireEntitlement(auth.user, reply, 'stream_create'))) return;

  const schema = z.object({
    title: optionalText,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    startsAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const title = body.title ?? `${current.rows[0].tournament_title} · ${current.rows[0].round_name ?? 'Матч'}`;
  const existingStream = await query<{ id: string }>(
    'SELECT id FROM streams WHERE match_id = $1 ORDER BY created_at DESC LIMIT 1',
    [params.data.id],
  );
  const result = existingStream.rows[0]
    ? await query(
        `
          UPDATE streams
          SET title = $2,
              status = $3::content_status,
              starts_at = $4,
              updated_at = now()
          WHERE id = $1
          RETURNING id, title, match_id, status, starts_at, created_at, updated_at,
                    (youtube_video_id IS NOT NULL AND length(trim(youtube_video_id)) > 0) AS has_video
        `,
        [existingStream.rows[0].id, title, body.status, body.startsAt],
      )
    : await query(
        `
          INSERT INTO streams (title, match_id, status, starts_at)
          VALUES ($1, $2, $3::content_status, $4)
          RETURNING id, title, match_id, status, starts_at, created_at, updated_at,
                    (youtube_video_id IS NOT NULL AND length(trim(youtube_video_id)) > 0) AS has_video
        `,
        [title, params.data.id, body.status, body.startsAt],
      );

  if (!result.rows[0].has_video) {
    await notifySuperadmins({
      title: 'Нужен YouTube Video ID',
      body: result.rows[0].title,
      data: routeData('/streams', {
        type: 'stream_video_id_required',
        streamId: result.rows[0].id,
        matchId: params.data.id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.post('/admin/files/presign-upload', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const body = uploadRequestSchema.parse(request.body);
  return { data: await createPresignedUploadUrl(body) };
});

app.get('/admin/summary', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query<{
    clubs: string;
    streams: string;
    tournaments: string;
    users: string;
    registrations: string;
    matches: string;
    duels: string;
    listings: string;
    orders: string;
    push_tokens: string;
    push_campaigns: string;
    news: string;
    products: string;
    training_templates: string;
    training_metrics: string;
    profile_statuses: string;
  }>(
    `
      SELECT
        (SELECT count(*)::text FROM clubs) AS clubs,
        (SELECT count(*)::text FROM streams) AS streams,
        (SELECT count(*)::text FROM tournaments) AS tournaments,
        (SELECT count(*)::text FROM users) AS users,
        (SELECT count(*)::text FROM tournament_registrations) AS registrations,
        (SELECT count(*)::text FROM matches) AS matches,
        (SELECT count(*)::text FROM duels) AS duels,
        (SELECT count(*)::text FROM listings) AS listings,
        (SELECT count(*)::text FROM orders) AS orders,
        (SELECT count(*)::text FROM push_tokens) AS push_tokens,
        (SELECT count(*)::text FROM push_campaigns) AS push_campaigns,
        (SELECT count(*)::text FROM news_posts) AS news,
        (SELECT count(*)::text FROM products) AS products,
        (SELECT count(*)::text FROM training_templates) AS training_templates,
        (SELECT count(*)::text FROM training_metrics) AS training_metrics,
        (SELECT count(*)::text FROM profile_statuses) AS profile_statuses
    `,
  );
  return { data: result.rows[0] };
});

app.get('/admin/profile-statuses', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT *
      FROM profile_statuses
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 200
    `,
  );
  return { data: result.rows };
});

app.post('/admin/profile-statuses', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    label: z.string().trim().min(2),
    description: optionalText,
    sortOrder: z.coerce.number().int().default(0),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO profile_statuses (label, description, sort_order, status)
      VALUES ($1, $2, $3, $4::content_status)
      RETURNING *
    `,
    [body.label, body.description, body.sortOrder, body.status],
  );
  return { data: result.rows[0] };
});

app.patch('/admin/profile-statuses/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    label: z.string().trim().min(2).optional(),
    description: optionalText,
    sortOrder: z.coerce.number().int().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE profile_statuses
      SET label = COALESCE($2, label),
          description = COALESCE($3, description),
          sort_order = COALESCE($4, sort_order),
          status = COALESCE($5::content_status, status),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.label ?? null, body.description, body.sortOrder ?? null, body.status ?? null],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.delete('/admin/profile-statuses/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM profile_statuses WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/users', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT u.id, u.firebase_uid, u.email, u.display_name, u.photo_url, u.city, u.role,
             u.created_at, p.rating, p.rating_source, p.club_name, p.skill_level, p.titles, p.wins, p.losses,
             p.profile_status_id, ps.label AS profile_status_label,
             club_admin.club_id AS club_admin_club_id, club_admin.club_name AS club_admin_club_name,
             app_access.ends_at AS app_access_until,
             stream_watch.ends_at AS stream_watch_until,
             stream_create.ends_at AS stream_create_until,
             listing_publish.ends_at AS listing_publish_until,
             CASE
               WHEN (p.wins + p.losses) > 0 THEN round((p.wins::numeric / (p.wins + p.losses)) * 100, 1)
               ELSE 0
             END AS win_percentage
      FROM users u
      LEFT JOIN player_profiles p ON p.user_id = u.id
      LEFT JOIN profile_statuses ps ON ps.id = p.profile_status_id
      LEFT JOIN LATERAL (
        SELECT cm.club_id, c.name AS club_name
        FROM club_memberships cm
        JOIN clubs c ON c.id = cm.club_id
        WHERE cm.user_id = u.id AND cm.status = 'active'
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) club_admin ON true
      LEFT JOIN user_entitlements app_access
        ON app_access.user_id = u.id AND app_access.feature = 'app_access'
      LEFT JOIN user_entitlements stream_watch
        ON stream_watch.user_id = u.id AND stream_watch.feature = 'stream_watch'
      LEFT JOIN user_entitlements stream_create
        ON stream_create.user_id = u.id AND stream_create.feature = 'stream_create'
      LEFT JOIN user_entitlements listing_publish
        ON listing_publish.user_id = u.id AND listing_publish.feature = 'listing_publish'
      ORDER BY u.created_at DESC
      LIMIT 200
    `,
  );
  return { data: result.rows };
});

app.patch('/admin/users/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    displayName: z.string().trim().min(2).optional(),
    city: optionalText,
    role: userRoleSchema.optional(),
    rating: z.coerce.number().int().min(0).optional(),
    clubName: optionalText,
    skillLevel: optionalText,
    profileStatusId: optionalDbId,
    titles: optionalTextArray,
    wins: z.coerce.number().int().min(0).optional(),
    losses: z.coerce.number().int().min(0).optional(),
    clubAdminClubId: optionalDbId,
    appAccessUntil: optionalDate,
    streamWatchUntil: optionalDate,
    listingPublishUntil: optionalDate,
  });
  const body = schema.parse(request.body);

  const user = await query(
    `
      UPDATE users
      SET display_name = COALESCE($2, display_name),
          city = COALESCE($3, city),
          role = COALESCE($4::user_role, role),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.displayName ?? null, body.city, body.role ?? null],
  );

  if (!user.rows[0]) return reply.code(404).send({ error: 'not_found' });

  await query(
    `
      INSERT INTO player_profiles (user_id, rating, rating_source, club_name, skill_level, profile_status_id, titles, wins, losses)
      VALUES ($1, COALESCE($2, 0), 'local', $3, $4, $5, COALESCE($6::text[], '{}'), COALESCE($7, 0), COALESCE($8, 0))
      ON CONFLICT DO NOTHING
    `,
    [
      params.data.id,
      body.rating ?? null,
      body.clubName,
      body.skillLevel,
      body.profileStatusId,
      body.titles ?? null,
      body.wins ?? null,
      body.losses ?? null,
    ],
  );

  const profile = await query(
    `
      UPDATE player_profiles
      SET rating = COALESCE($2, rating),
          club_name = COALESCE($3, club_name),
          skill_level = COALESCE($4, skill_level),
          profile_status_id = COALESCE($5, profile_status_id),
          titles = COALESCE($6::text[], titles),
          wins = COALESCE($7, wins),
          losses = COALESCE($8, losses),
          updated_at = now()
      WHERE user_id = $1
      RETURNING *
    `,
    [
      params.data.id,
      body.rating ?? null,
      body.clubName,
      body.skillLevel,
      body.profileStatusId,
      body.titles ?? null,
      body.wins ?? null,
      body.losses ?? null,
    ],
  );

  if (body.clubAdminClubId) {
    await query(
      `
        INSERT INTO club_memberships (user_id, club_id, role, status)
        VALUES ($1, $2, 'club_admin', 'active')
        ON CONFLICT (user_id, club_id, role)
        DO UPDATE SET status = 'active', updated_at = now()
      `,
      [params.data.id, body.clubAdminClubId],
    );
    await upsertEntitlement(params.data.id, 'club_admin', body.appAccessUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    await upsertEntitlement(params.data.id, 'stream_create', body.streamWatchUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
  }

  await upsertEntitlement(params.data.id, 'app_access', body.appAccessUntil);
  await upsertEntitlement(params.data.id, 'stream_watch', body.streamWatchUntil);
  await upsertEntitlement(params.data.id, 'listing_publish', body.listingPublishUntil);

  if (body.role || body.clubAdminClubId || body.appAccessUntil || body.streamWatchUntil || body.listingPublishUntil) {
    await notifyUsers([params.data.id], {
      title: 'Доступ обновлен',
      body: 'Права и периоды доступа в приложении обновлены.',
      data: routeData('/profile', {
        type: 'access_updated',
        userId: params.data.id,
      }),
    });
  }

  return { data: { user: user.rows[0], profile: profile.rows[0] ?? null } };
});

app.delete('/admin/users/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM users WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/tournaments', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT t.*, c.name AS club_name, c.city AS club_city,
             (SELECT count(*)::int FROM tournament_registrations r WHERE r.tournament_id = t.id) AS registrations_count
      FROM tournaments t
      LEFT JOIN clubs c ON c.id = t.club_id
      ORDER BY COALESCE(t.starts_at, t.created_at) DESC
      LIMIT 200
    `,
  );
  return { data: result.rows };
});

app.post('/admin/tournaments', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    status: z.enum(['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled']).default('draft'),
    startsAt: optionalDate,
    endsAt: optionalDate,
    clubId: optionalDbId,
    location: optionalText,
    discipline: disciplineSchema.default('Москва'),
    tournamentFormat: tournamentFormatSchema.default('single_elimination'),
    entryFeeCents: z.coerce.number().int().min(0).default(0),
    currency: z.string().trim().default('KZT'),
    maxPlayers: bracketSizeSchema.optional(),
    bannerKey: optionalText,
    firstPlaceUserId: optionalDbId,
    secondPlaceUserId: optionalDbId,
    thirdPlaceUserId: optionalDbId,
    thirdPlaceSecondUserId: optionalDbId,
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      INSERT INTO tournaments (
        title, status, starts_at, ends_at, club_id, location, discipline, tournament_format,
        entry_fee_cents, currency, max_players, banner_key,
        first_place_user_id, second_place_user_id, third_place_user_id, third_place_second_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `,
    [
      body.title,
      body.status,
      body.startsAt,
      body.endsAt,
      body.clubId,
      body.location,
      body.discipline,
      body.tournamentFormat,
      body.entryFeeCents,
      body.currency,
      body.maxPlayers ?? null,
      body.bannerKey,
      body.firstPlaceUserId,
      body.secondPlaceUserId,
      body.thirdPlaceUserId,
      body.thirdPlaceSecondUserId,
    ],
  );

  if (result.rows[0].status === 'registration_open') {
    await notifyAllEnabledUsers({
      title: 'Открыта регистрация на турнир',
      body: result.rows[0].title,
      data: routeData(`/tournaments/${result.rows[0].id}`, {
        type: 'tournament_registration_open',
        tournamentId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/admin/tournaments/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    status: z.enum(['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled']).optional(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    clubId: optionalDbId,
    location: optionalText,
    discipline: disciplineSchema.optional(),
    tournamentFormat: tournamentFormatSchema.optional(),
    entryFeeCents: z.coerce.number().int().min(0).optional(),
    maxPlayers: bracketSizeSchema.optional(),
    bannerKey: optionalText,
    firstPlaceUserId: optionalDbId,
    secondPlaceUserId: optionalDbId,
    thirdPlaceUserId: optionalDbId,
    thirdPlaceSecondUserId: optionalDbId,
  });
  const body = schema.parse(request.body);
  const current = await query('SELECT id, title, status FROM tournaments WHERE id = $1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE tournaments
      SET title = COALESCE($2, title),
          status = COALESCE($3::tournament_status, status),
          starts_at = COALESCE($4, starts_at),
          ends_at = COALESCE($5, ends_at),
          club_id = COALESCE($6, club_id),
          location = COALESCE($7, location),
          discipline = COALESCE($8, discipline),
          tournament_format = COALESCE($9, tournament_format),
          entry_fee_cents = COALESCE($10, entry_fee_cents),
          max_players = COALESCE($11, max_players),
          banner_key = COALESCE($12, banner_key),
          first_place_user_id = COALESCE($13, first_place_user_id),
          second_place_user_id = COALESCE($14, second_place_user_id),
          third_place_user_id = COALESCE($15, third_place_user_id),
          third_place_second_user_id = COALESCE($16, third_place_second_user_id),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      params.data.id,
      body.title ?? null,
      body.status ?? null,
      body.startsAt,
      body.endsAt,
      body.clubId,
      body.location,
      body.discipline ?? null,
      body.tournamentFormat ?? null,
      body.entryFeeCents ?? null,
      body.maxPlayers ?? null,
      body.bannerKey,
      body.firstPlaceUserId,
      body.secondPlaceUserId,
      body.thirdPlaceUserId,
      body.thirdPlaceSecondUserId,
    ],
  );

  if (result.rows[0].status === 'registration_open' && current.rows[0].status !== 'registration_open') {
    await notifyAllEnabledUsers({
      title: 'Открыта регистрация на турнир',
      body: result.rows[0].title,
      data: routeData(`/tournaments/${result.rows[0].id}`, {
        type: 'tournament_registration_open',
        tournamentId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.delete('/admin/tournaments/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM tournaments WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.post('/admin/tournaments/:id/generate-bracket', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const tournament = await query(
    'SELECT tournament_format, max_players FROM tournaments WHERE id = $1',
    [params.data.id],
  );
  if (!tournament.rows[0]) return reply.code(404).send({ error: 'not_found' });
  if (tournament.rows[0].tournament_format !== 'single_elimination') {
    return reply.code(409).send({
      error: 'unsupported_tournament_format',
      message: 'Автогенератор сейчас поддерживает только олимпийскую сетку. Для лиги, швейцарки и групп матчи создаются вручную.',
    });
  }

  const activeMatches = await query(
    `
      SELECT count(*)::int AS count
      FROM matches
      WHERE tournament_id = $1
        AND (
          status = 'live'
          OR (status = 'completed' AND COALESCE(score, '') <> 'BYE')
        )
    `,
    [params.data.id],
  );
  if (Number(activeMatches.rows[0]?.count ?? 0) > 0) {
    return reply.code(409).send({
      error: 'bracket_locked',
      message: 'Нельзя пересобрать сетку, если уже есть live/completed матчи.',
    });
  }

  const players = await query<BracketSeedPlayer>(
    `
      SELECT r.user_id, u.display_name, r.seed_number
      FROM tournament_registrations r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN player_profiles p ON p.user_id = u.id
      WHERE r.tournament_id = $1 AND r.status = 'confirmed'
      ORDER BY COALESCE(r.seed_number, 9999) ASC, COALESCE(p.rating, 0) DESC, u.display_name ASC
    `,
    [params.data.id],
  );

  if (players.rows.length < 2) {
    return reply.code(409).send({
      error: 'not_enough_players',
      message: 'Для сетки нужно минимум 2 подтвержденных участника.',
    });
  }

  if (players.rows.length > Number(tournament.rows[0].max_players ?? 16)) {
    return reply.code(409).send({
      error: 'too_many_players_for_bracket',
      message: 'Количество подтвержденных игроков больше размера сетки.',
    });
  }

  const generatedMatches = buildSingleEliminationBracket(params.data.id, players.rows, Number(tournament.rows[0].max_players ?? 16));
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM matches WHERE tournament_id = $1', [params.data.id]);

    for (const match of [...generatedMatches].sort((a, b) => b.roundNumber - a.roundNumber || a.bracketPosition - b.bracketPosition)) {
      await client.query(
        `
          INSERT INTO matches (
            id,
            tournament_id,
            player_a_id,
            player_b_id,
            winner_id,
            next_match_id,
            next_slot,
            score,
            round_name,
            round_number,
            bracket_position,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [
          match.id,
          match.tournamentId,
          match.playerAId,
          match.playerBId,
          match.winnerId,
          match.nextMatchId,
          match.nextSlot,
          match.score,
          match.roundName,
          match.roundNumber,
          match.bracketPosition,
          match.status,
        ],
      );
    }

    await client.query(
      `
        UPDATE tournaments
        SET status = CASE
            WHEN status = 'registration_open' THEN 'registration_closed'::tournament_status
            ELSE status
          END,
          updated_at = now()
        WHERE id = $1
      `,
      [params.data.id],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    data: {
      bracket_size: Number(tournament.rows[0].max_players ?? 16),
      players_count: players.rows.length,
      matches_count: generatedMatches.length,
    },
  };
});

app.get('/admin/registrations', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT r.*, t.title AS tournament_title, u.display_name AS user_name, p.rating, p.club_name
      FROM tournament_registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      JOIN users u ON u.id = r.user_id
      LEFT JOIN player_profiles p ON p.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 300
    `,
  );
  return { data: result.rows };
});

app.patch('/admin/registrations/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    status: z.enum(['pending', 'confirmed', 'waitlist', 'cancelled', 'rejected']).optional(),
    seedNumber: z.coerce.number().int().min(1).optional(),
  });
  const body = schema.parse(request.body);
  const current = await query(
    `
      SELECT r.id, r.user_id, r.status, r.tournament_id, t.title AS tournament_title
      FROM tournament_registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [params.data.id],
  );
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE tournament_registrations
      SET status = COALESCE($2::registration_status, status),
          seed_number = COALESCE($3, seed_number)
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.status ?? null, body.seedNumber ?? null],
  );

  if (body.status && result.rows[0].status !== current.rows[0].status) {
    await notifyUsers([current.rows[0].user_id], {
      title: 'Статус заявки обновлен',
      body: `${current.rows[0].tournament_title}: ${registrationStatusLabel(result.rows[0].status)}`,
      data: routeData(`/tournaments/${current.rows[0].tournament_id}`, {
        type: 'tournament_registration_status',
        tournamentId: current.rows[0].tournament_id,
        registrationId: result.rows[0].id,
        status: result.rows[0].status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.get('/admin/matches', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT m.*, t.title AS tournament_title, player_a.display_name AS player_a_name,
             player_b.display_name AS player_b_name, winner.display_name AS winner_name,
             s.id AS stream_id, s.title AS stream_title, s.youtube_video_id AS stream_youtube_video_id,
             s.status AS stream_status, s.starts_at AS stream_starts_at
      FROM matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      LEFT JOIN users winner ON winner.id = m.winner_id
      LEFT JOIN streams s ON s.match_id = m.id
      ORDER BY COALESCE(m.scheduled_at, m.created_at) DESC
      LIMIT 300
    `,
  );
  return { data: result.rows };
});

app.get('/admin/streams', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT s.*, t.title AS tournament_title, m.round_name, m.round_number, m.bracket_position,
             player_a.display_name AS player_a_name, player_b.display_name AS player_b_name
      FROM streams s
      LEFT JOIN matches m ON m.id = s.match_id
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      ORDER BY COALESCE(s.starts_at, s.created_at) DESC
      LIMIT 300
    `,
  );
  return { data: result.rows };
});

app.post('/admin/streams', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(1),
    youtubeVideoId: optionalText,
    matchId: optionalDbId,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    startsAt: optionalDate,
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      INSERT INTO streams (title, youtube_video_id, match_id, status, starts_at)
      VALUES ($1, $2, $3, $4::content_status, $5)
      RETURNING *
    `,
    [body.title, body.youtubeVideoId, body.matchId, body.status, body.startsAt],
  );

  const hasVideo = Boolean(result.rows[0].youtube_video_id && String(result.rows[0].youtube_video_id).trim());
  if (result.rows[0].status === 'published' && hasVideo) {
    await notifyUsersWithFeature('stream_watch', {
      title: 'Трансляция доступна',
      body: result.rows[0].title,
      data: routeData(`/streams/${result.rows[0].id}`, {
        type: 'stream_published',
        streamId: result.rows[0].id,
        matchId: result.rows[0].match_id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/admin/streams/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    title: z.string().trim().min(1),
    youtubeVideoId: optionalText,
    matchId: optionalDbId,
    status: z.enum(['draft', 'published', 'archived']),
    startsAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const current = await query('SELECT id, status, youtube_video_id FROM streams WHERE id = $1 LIMIT 1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE streams
      SET title = $2,
          youtube_video_id = $3,
          match_id = $4,
          status = $5::content_status,
          starts_at = $6,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title, body.youtubeVideoId, body.matchId, body.status, body.startsAt],
  );

  const hasVideo = Boolean(result.rows[0].youtube_video_id && String(result.rows[0].youtube_video_id).trim());
  const becamePublished = result.rows[0].status === 'published'
    && hasVideo
    && (current.rows[0].status !== 'published' || !current.rows[0].youtube_video_id);
  if (becamePublished) {
    await notifyUsersWithFeature('stream_watch', {
      title: 'Трансляция доступна',
      body: result.rows[0].title,
      data: routeData(`/streams/${result.rows[0].id}`, {
        type: 'stream_published',
        streamId: result.rows[0].id,
        matchId: result.rows[0].match_id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.delete('/admin/streams/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM streams WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.post('/admin/matches', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    tournamentId: dbId,
    playerAId: optionalDbId,
    playerBId: optionalDbId,
    roundName: z.string().trim().default('Round 1'),
    roundNumber: z.coerce.number().int().min(1).default(1),
    bracketPosition: z.coerce.number().int().min(1).default(1),
    tableNumber: z.coerce.number().int().min(1).optional(),
    scheduledAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO matches (
        tournament_id,
        player_a_id,
        player_b_id,
        round_name,
        round_number,
        bracket_position,
        table_number,
        scheduled_at,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled')
      RETURNING *
    `,
    [
      body.tournamentId,
      body.playerAId,
      body.playerBId,
      body.roundName,
      body.roundNumber,
      body.bracketPosition,
      body.tableNumber ?? null,
      body.scheduledAt,
    ],
  );

  const tournament = await query('SELECT title FROM tournaments WHERE id = $1', [body.tournamentId]);
  await notifyUsers([body.playerAId, body.playerBId], {
    title: 'Матч назначен',
    body: `${tournament.rows[0]?.title ?? 'Турнир'}${body.tableNumber ? ` · стол ${body.tableNumber}` : ''}`,
    data: routeData(`/tournaments/${body.tournamentId}/matches/${result.rows[0].id}`, {
      type: 'match_created',
      matchId: result.rows[0].id,
      tournamentId: body.tournamentId,
    }),
  });

  return { data: result.rows[0] };
});

app.patch('/admin/matches/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    playerAId: optionalDbId,
    playerBId: optionalDbId,
    score: optionalText,
    roundName: z.string().trim().optional(),
    status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
    winnerId: optionalDbId,
    tableNumber: z.coerce.number().int().min(1).optional(),
    scheduledAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const current = await query(
    `
      SELECT m.id, m.player_a_id, m.player_b_id, m.status, m.score, m.table_number,
             m.scheduled_at, t.title AS tournament_title
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = $1
      LIMIT 1
    `,
    [params.data.id],
  );
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE matches
      SET player_a_id = COALESCE($2, player_a_id),
          player_b_id = COALESCE($3, player_b_id),
          score = COALESCE($4, score),
          round_name = COALESCE($5, round_name),
          status = COALESCE($6::match_status, status),
          winner_id = COALESCE($7, winner_id),
          table_number = COALESCE($8, table_number),
          scheduled_at = COALESCE($9, scheduled_at),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      params.data.id,
      body.playerAId,
      body.playerBId,
      body.score,
      body.roundName ?? null,
      body.status ?? null,
      body.winnerId,
      body.tableNumber ?? null,
      body.scheduledAt,
    ],
  );

  const updatedMatch = result.rows[0] as {
    id: string;
    tournament_id: string;
    player_a_id: string | null;
    player_b_id: string | null;
    score: string | null;
    status: string;
    table_number: number | null;
    winner_id: string | null;
    next_match_id: string | null;
    next_slot: 'A' | 'B' | null;
  };
  if (updatedMatch.status === 'completed' && updatedMatch.winner_id && updatedMatch.next_match_id && updatedMatch.next_slot) {
    await query(
      `
        UPDATE matches
        SET player_a_id = CASE WHEN $3 = 'A' THEN $2 ELSE player_a_id END,
            player_b_id = CASE WHEN $3 = 'B' THEN $2 ELSE player_b_id END,
            updated_at = now()
        WHERE id = $1
      `,
      [updatedMatch.next_match_id, updatedMatch.winner_id, updatedMatch.next_slot],
    );
  }

  const shouldNotifyPlayers = Boolean(
    body.playerAId
    || body.playerBId
    || body.score
    || body.status
    || body.winnerId
    || body.tableNumber
    || body.scheduledAt,
  );
  if (shouldNotifyPlayers) {
    await notifyUsers([updatedMatch.player_a_id, updatedMatch.player_b_id], {
      title: updatedMatch.status === 'live'
        ? 'Матч начался'
        : updatedMatch.status === 'completed'
          ? 'Матч завершен'
          : 'Матч обновлен',
      body: `${current.rows[0].tournament_title}: ${matchStatusLabel(updatedMatch.status)}${updatedMatch.score ? ` · ${updatedMatch.score}` : ''}${updatedMatch.table_number ? ` · стол ${updatedMatch.table_number}` : ''}`,
      data: routeData(`/tournaments/${updatedMatch.tournament_id}/matches/${updatedMatch.id}`, {
        type: 'match_updated',
        matchId: updatedMatch.id,
        tournamentId: updatedMatch.tournament_id,
        status: updatedMatch.status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.delete('/admin/matches/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM matches WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/news', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query('SELECT * FROM news_posts ORDER BY created_at DESC LIMIT 200');
  return { data: result.rows };
});

app.post('/admin/news', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    body: optionalText,
    imageKey: optionalText,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  });
  const body = schema.parse(request.body);
  const publishedAt = body.status === 'published' ? new Date().toISOString() : null;

  const result = await query(
    `
      INSERT INTO news_posts (title, body, image_key, status, published_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [body.title, body.body, body.imageKey, body.status, publishedAt],
  );

  if (result.rows[0].status === 'published') {
    await notifyAllEnabledUsers({
      title: 'Новая новость',
      body: result.rows[0].title,
      data: routeData(`/news/${result.rows[0].id}`, {
        type: 'news_published',
        newsId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/admin/news/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    body: optionalText,
    imageKey: optionalText,
    status: z.enum(['draft', 'published', 'archived']).optional(),
  });
  const body = schema.parse(request.body);
  const current = await query('SELECT id, status, published_at FROM news_posts WHERE id = $1 LIMIT 1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE news_posts
      SET title = COALESCE($2, title),
          body = COALESCE($3, body),
          image_key = COALESCE($4, image_key),
          status = COALESCE($5::content_status, status),
          published_at = CASE WHEN $5 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title ?? null, body.body, body.imageKey, body.status ?? null],
  );

  if (result.rows[0].status === 'published' && current.rows[0].status !== 'published') {
    await notifyAllEnabledUsers({
      title: 'Новая новость',
      body: result.rows[0].title,
      data: routeData(`/news/${result.rows[0].id}`, {
        type: 'news_published',
        newsId: result.rows[0].id,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.delete('/admin/news/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM news_posts WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/clubs', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query('SELECT * FROM clubs ORDER BY created_at DESC LIMIT 200');
  return { data: result.rows };
});

app.post('/admin/clubs', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    name: z.string().trim().min(2),
    address: optionalText,
    city: z.string().trim().default('Astana'),
    phone: optionalText,
    imageKey: optionalText,
    twoGisUrl: optionalText,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO clubs (name, address, city, phone, image_key, two_gis_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [body.name, body.address, body.city, body.phone, body.imageKey, body.twoGisUrl],
  );
  return { data: result.rows[0] };
});

app.patch('/admin/clubs/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    name: z.string().trim().min(2).optional(),
    address: optionalText,
    city: z.string().trim().optional(),
    phone: optionalText,
    imageKey: optionalText,
    twoGisUrl: optionalText,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE clubs
      SET name = COALESCE($2, name),
          address = COALESCE($3, address),
          city = COALESCE($4, city),
          phone = COALESCE($5, phone),
          image_key = COALESCE($6, image_key),
          two_gis_url = COALESCE($7, two_gis_url),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.name ?? null, body.address, body.city ?? null, body.phone, body.imageKey, body.twoGisUrl],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.delete('/admin/clubs/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM clubs WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/listings', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT l.*, u.display_name AS user_name
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT 200
    `,
  );
  return { data: result.rows };
});

app.post('/admin/listings', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    userId: optionalDbId,
    title: z.string().trim().min(2),
    description: optionalText,
    category: listingCategorySchema.default('misc'),
    priceCents: z.coerce.number().int().min(0).optional(),
    currency: z.string().trim().default('KZT'),
    status: z.enum(['draft', 'moderation', 'published', 'rejected', 'archived']).default('published'),
    imageKeys: z.array(z.string().trim().min(1)).optional(),
    publishedUntil: optionalDate,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO listings (user_id, title, description, category, price_cents, currency, status, image_keys, published_until)
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::text[], '{}'), COALESCE($9, now() + interval '7 days'))
      RETURNING *
    `,
    [
      body.userId,
      body.title,
      body.description,
      body.category,
      body.priceCents ?? null,
      body.currency,
      body.status,
      body.imageKeys ?? null,
      body.publishedUntil,
    ],
  );

  if (result.rows[0].user_id && result.rows[0].status === 'published') {
    await notifyUsers([result.rows[0].user_id], {
      title: 'Объявление опубликовано',
      body: result.rows[0].title,
      data: routeData(`/listings/${result.rows[0].id}`, {
        type: 'listing_status',
        listingId: result.rows[0].id,
        status: result.rows[0].status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.patch('/admin/listings/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    description: optionalText,
    category: listingCategorySchema.optional(),
    priceCents: z.coerce.number().int().min(0).optional(),
    status: z.enum(['draft', 'moderation', 'published', 'rejected', 'archived']).optional(),
    imageKeys: z.array(z.string().trim().min(1)).optional(),
    publishedUntil: optionalDate,
  });
  const body = schema.parse(request.body);
  const current = await query('SELECT id, user_id, title, status FROM listings WHERE id = $1 LIMIT 1', [params.data.id]);
  if (!current.rows[0]) return reply.code(404).send({ error: 'not_found' });

  const result = await query(
    `
      UPDATE listings
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          price_cents = COALESCE($5, price_cents),
          status = COALESCE($6::listing_status, status),
          image_keys = COALESCE($7::text[], image_keys),
          published_until = COALESCE($8, published_until),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [
      params.data.id,
      body.title ?? null,
      body.description,
      body.category ?? null,
      body.priceCents ?? null,
      body.status ?? null,
      body.imageKeys ?? null,
      body.publishedUntil,
    ],
  );

  if (result.rows[0].user_id && body.status && result.rows[0].status !== current.rows[0].status) {
    const titleByStatus: Record<string, string> = {
      published: 'Объявление опубликовано',
      rejected: 'Объявление отклонено',
      archived: 'Объявление снято',
      moderation: 'Объявление на модерации',
      draft: 'Объявление сохранено как черновик',
    };
    await notifyUsers([result.rows[0].user_id], {
      title: titleByStatus[result.rows[0].status] ?? 'Статус объявления обновлен',
      body: result.rows[0].title,
      data: routeData(result.rows[0].status === 'published' ? `/listings/${result.rows[0].id}` : '/listings', {
        type: 'listing_status',
        listingId: result.rows[0].id,
        status: result.rows[0].status,
      }),
    });
  }

  return { data: result.rows[0] };
});

app.delete('/admin/listings/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM listings WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/products', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT 200');
  return { data: result.rows };
});

app.post('/admin/products', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    description: optionalText,
    priceCents: z.coerce.number().int().min(0).default(0),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    imageKey: optionalText,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO products (title, description, price_cents, status, image_key)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [body.title, body.description, body.priceCents, body.status, body.imageKey],
  );
  return { data: result.rows[0] };
});

app.patch('/admin/products/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    description: optionalText,
    priceCents: z.coerce.number().int().min(0).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    imageKey: optionalText,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE products
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          price_cents = COALESCE($4, price_cents),
          status = COALESCE($5::content_status, status),
          image_key = COALESCE($6, image_key),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title ?? null, body.description, body.priceCents ?? null, body.status ?? null, body.imageKey],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.delete('/admin/products/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM products WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/training-templates', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query('SELECT * FROM training_templates ORDER BY sort_order ASC, created_at ASC LIMIT 200');
  return { data: result.rows };
});

app.post('/admin/training-templates', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    target: optionalText,
    metric: optionalText,
    sortOrder: z.coerce.number().int().min(0).default(0),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO training_templates (title, target, metric, sort_order, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [body.title, body.target, body.metric, body.sortOrder, body.status],
  );
  return { data: result.rows[0] };
});

app.patch('/admin/training-templates/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    target: optionalText,
    metric: optionalText,
    sortOrder: z.coerce.number().int().min(0).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE training_templates
      SET title = COALESCE($2, title),
          target = COALESCE($3, target),
          metric = COALESCE($4, metric),
          sort_order = COALESCE($5, sort_order),
          status = COALESCE($6::content_status, status),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title ?? null, body.target, body.metric, body.sortOrder ?? null, body.status ?? null],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.delete('/admin/training-templates/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM training_templates WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.get('/admin/push-tokens', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT p.*, u.display_name, u.email
      FROM push_tokens p
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 500
    `,
  );
  return { data: result.rows };
});

app.get('/admin/push-campaigns', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query('SELECT * FROM push_campaigns ORDER BY created_at DESC LIMIT 100');
  return { data: result.rows };
});

app.post('/admin/push-campaigns', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    title: z.string().trim().min(2),
    body: z.string().trim().min(2),
    target: z.string().trim().default('all'),
    sendNow: z.boolean().optional(),
  });
  const body = schema.parse(request.body);

  const tokens = body.sendNow
    ? await query<{ expo_push_token: string }>(
        'SELECT expo_push_token FROM push_tokens WHERE enabled = TRUE LIMIT 500',
      )
    : { rows: [] };

  const recipients = body.sendNow
    ? await sendExpoPushMessages(tokens.rows.map((token) => token.expo_push_token), {
        title: body.title,
        body: body.body,
        data: routeData('/home', { type: 'admin_campaign' }),
      })
    : 0;

  const result = await query(
    `
      INSERT INTO push_campaigns (title, body, target, status, sent_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      body.title,
      body.body,
      body.target,
      body.sendNow ? 'published' : 'draft',
      body.sendNow ? new Date().toISOString() : null,
    ],
  );
  return { data: { campaign: result.rows[0], recipients } };
});

app.patch('/admin/push-campaigns/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    body: z.string().trim().min(2).optional(),
    target: z.string().trim().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      UPDATE push_campaigns
      SET title = COALESCE($2, title),
          body = COALESCE($3, body),
          target = COALESCE($4, target),
          status = COALESCE($5::content_status, status),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title ?? null, body.body ?? null, body.target ?? null, body.status ?? null],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.delete('/admin/push-campaigns/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  await query('DELETE FROM push_campaigns WHERE id = $1', [params.data.id]);
  return { ok: true };
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  if (error instanceof z.ZodError) {
    return reply.code(400).send({
      error: 'validation_error',
      issues: error.issues,
    });
  }

  const statusCode =
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : 500;

  return reply.code(statusCode).send({
    error: statusCode >= 500 ? 'internal_error' : 'bad_request',
    message:
      env.nodeEnv === 'production' && statusCode >= 500
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Unknown error',
  });
});

const close = async () => {
  await app.close();
  await closeDb();
};

process.on('SIGINT', () => void close().then(() => process.exit(0)));
process.on('SIGTERM', () => void close().then(() => process.exit(0)));

await app.listen({ port: env.port, host: env.host });
