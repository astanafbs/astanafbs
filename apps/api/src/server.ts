import cors from '@fastify/cors';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { closeDb, query } from './db.js';
import { requireUser, upsertUser, verifyBearerToken } from './auth.js';
import { env } from './env.js';
import { createPresignedUploadUrl } from './storage.js';

const app = Fastify({
  logger: {
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
  },
});
const dbId = z.string().regex(/^[0-9a-f-]{36}$/i);
const optionalDbId = dbId.nullish().transform((value) => value || null);
const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalDate = z.string().trim().optional().transform((value) => value ? new Date(value).toISOString() : null);

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers['x-admin-token'];
  const value = Array.isArray(token) ? token[0] : token;

  if (!env.adminApiToken || value !== env.adminApiToken) {
    reply.code(401).send({ error: 'admin_unauthorized', message: 'Admin token is required' });
    return false;
  }

  return true;
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

  const profile = await query(
    'select * from player_profiles where user_id = $1 limit 1',
    [user.id],
  );

  return { user, profile: profile.rows[0] ?? null };
});

app.patch('/me', async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;

  const schema = z.object({
    displayName: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    clubName: z.string().min(2).optional(),
    skillLevel: z.string().min(2).optional(),
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
          updated_at = now()
      WHERE user_id = $1
      RETURNING *
    `,
    [user.id, body.clubName ?? null, body.skillLevel ?? null],
  );

  return { user: updatedUser.rows[0], profile: updatedProfile.rows[0] ?? null };
});

app.get('/news', async () => {
  const result = await query(
    `
      SELECT id, title, body, image_key, status, published_at, created_at
      FROM news_posts
      WHERE status IN ('published', 'draft')
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT 50
    `,
  );
  return { data: result.rows };
});

app.get('/clubs', async () => {
  const result = await query('SELECT * FROM clubs ORDER BY name ASC LIMIT 100');
  return { data: result.rows };
});

app.get('/streams', async () => {
  const result = await query(
    `
      SELECT *
      FROM streams
      WHERE status IN ('published', 'draft')
      ORDER BY COALESCE(starts_at, created_at) DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/listings', async () => {
  const result = await query(
    `
      SELECT l.*, u.display_name AS user_name
      FROM listings l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.status IN ('published', 'moderation')
      ORDER BY l.created_at DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/products', async () => {
  const result = await query(
    `
      SELECT *
      FROM products
      WHERE status IN ('published', 'draft')
      ORDER BY created_at DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/tournaments', async () => {
  const result = await query(
    `
      SELECT t.*, c.name AS club_name
      FROM tournaments t
      LEFT JOIN clubs c ON c.id = t.club_id
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
      SELECT t.*, c.name AS club_name
      FROM tournaments t
      LEFT JOIN clubs c ON c.id = t.club_id
      WHERE t.id = $1
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

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const tournament = await query(
    'select id, status, max_players from tournaments where id = $1',
    [params.data.id],
  );
  const tournamentRow = tournament.rows[0];

  if (!tournamentRow) return reply.code(404).send({ error: 'not_found' });
  if (tournamentRow.status !== 'registration_open') {
    return reply.code(409).send({ error: 'registration_closed' });
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
      ON CONFLICT (tournament_id, user_id)
      DO UPDATE SET status = tournament_registrations.status
      RETURNING *
    `,
    [params.data.id, user.id],
  );

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
             winner.display_name AS winner_name
      FROM matches m
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      LEFT JOIN users winner ON winner.id = m.winner_id
      WHERE m.tournament_id = $1
      ORDER BY COALESCE(m.scheduled_at, m.created_at) ASC
    `,
    [params.data.id],
  );

  return { data: result.rows };
});

app.get('/ratings', async () => {
  const result = await query(
    `
      SELECT u.id, u.display_name, u.photo_url, u.city, p.rating, p.rating_source, p.club_name,
             p.wins, p.losses
      FROM player_profiles p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.rating DESC, p.wins DESC
      LIMIT 100
    `,
  );
  return { data: result.rows };
});

app.get('/players/:id', async (request, reply) => {
  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });

  const result = await query(
    `
      SELECT u.id, u.display_name, u.photo_url, u.city, p.rating, p.rating_source,
             p.club_name, p.skill_level, p.wins, p.losses
      FROM users u
      LEFT JOIN player_profiles p ON p.user_id = u.id
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

  const schema = z.object({
    folder: z.enum(['avatars', 'banners', 'news', 'products', 'listings']),
    filename: z.string().min(1),
    contentType: z.string().min(3),
  });
  const body = schema.parse(request.body);
  return { data: await createPresignedUploadUrl(body) };
});

app.get('/admin/summary', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query<{
    tournaments: string;
    users: string;
    listings: string;
    push_tokens: string;
    news: string;
    products: string;
  }>(
    `
      SELECT
        (SELECT count(*)::text FROM tournaments) AS tournaments,
        (SELECT count(*)::text FROM users) AS users,
        (SELECT count(*)::text FROM listings) AS listings,
        (SELECT count(*)::text FROM push_tokens) AS push_tokens,
        (SELECT count(*)::text FROM news_posts) AS news,
        (SELECT count(*)::text FROM products) AS products
    `,
  );
  return { data: result.rows[0] };
});

app.get('/admin/users', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT u.id, u.firebase_uid, u.email, u.display_name, u.photo_url, u.city, u.role,
             u.created_at, p.rating, p.rating_source, p.club_name, p.skill_level, p.wins, p.losses
      FROM users u
      LEFT JOIN player_profiles p ON p.user_id = u.id
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
    role: z.enum(['player', 'club_owner', 'organizer', 'admin']).optional(),
    rating: z.coerce.number().int().min(0).optional(),
    clubName: optionalText,
    wins: z.coerce.number().int().min(0).optional(),
    losses: z.coerce.number().int().min(0).optional(),
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

  await query(
    `
      INSERT INTO player_profiles (user_id, rating, rating_source, club_name, wins, losses)
      VALUES ($1, COALESCE($2, 0), 'local', $3, COALESCE($4, 0), COALESCE($5, 0))
      ON CONFLICT DO NOTHING
    `,
    [params.data.id, body.rating ?? null, body.clubName, body.wins ?? null, body.losses ?? null],
  );

  const profile = await query(
    `
      UPDATE player_profiles
      SET rating = COALESCE($2, rating),
          club_name = COALESCE($3, club_name),
          wins = COALESCE($4, wins),
          losses = COALESCE($5, losses),
          updated_at = now()
      WHERE user_id = $1
      RETURNING *
    `,
    [params.data.id, body.rating ?? null, body.clubName, body.wins ?? null, body.losses ?? null],
  );

  if (!user.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: { user: user.rows[0], profile: profile.rows[0] ?? null } };
});

app.get('/admin/tournaments', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT t.*, c.name AS club_name,
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
    entryFeeCents: z.coerce.number().int().min(0).default(0),
    currency: z.string().trim().default('KZT'),
    maxPlayers: z.coerce.number().int().min(1).optional(),
    bannerKey: optionalText,
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      INSERT INTO tournaments (title, status, starts_at, ends_at, club_id, location, entry_fee_cents, currency, max_players, banner_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      body.title,
      body.status,
      body.startsAt,
      body.endsAt,
      body.clubId,
      body.location,
      body.entryFeeCents,
      body.currency,
      body.maxPlayers ?? null,
      body.bannerKey,
    ],
  );
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
    entryFeeCents: z.coerce.number().int().min(0).optional(),
    maxPlayers: z.coerce.number().int().min(1).optional(),
    bannerKey: optionalText,
  });
  const body = schema.parse(request.body);

  const result = await query(
    `
      UPDATE tournaments
      SET title = COALESCE($2, title),
          status = COALESCE($3::tournament_status, status),
          starts_at = COALESCE($4, starts_at),
          ends_at = COALESCE($5, ends_at),
          club_id = COALESCE($6, club_id),
          location = COALESCE($7, location),
          entry_fee_cents = COALESCE($8, entry_fee_cents),
          max_players = COALESCE($9, max_players),
          banner_key = COALESCE($10, banner_key),
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
      body.entryFeeCents ?? null,
      body.maxPlayers ?? null,
      body.bannerKey,
    ],
  );

  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
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
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
  return { data: result.rows[0] };
});

app.get('/admin/matches', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const result = await query(
    `
      SELECT m.*, t.title AS tournament_title, player_a.display_name AS player_a_name,
             player_b.display_name AS player_b_name, winner.display_name AS winner_name
      FROM matches m
      LEFT JOIN tournaments t ON t.id = m.tournament_id
      LEFT JOIN users player_a ON player_a.id = m.player_a_id
      LEFT JOIN users player_b ON player_b.id = m.player_b_id
      LEFT JOIN users winner ON winner.id = m.winner_id
      ORDER BY COALESCE(m.scheduled_at, m.created_at) DESC
      LIMIT 300
    `,
  );
  return { data: result.rows };
});

app.post('/admin/matches', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const schema = z.object({
    tournamentId: dbId,
    playerAId: optionalDbId,
    playerBId: optionalDbId,
    roundName: z.string().trim().default('Round 1'),
    scheduledAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO matches (tournament_id, player_a_id, player_b_id, round_name, scheduled_at, status)
      VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING *
    `,
    [body.tournamentId, body.playerAId, body.playerBId, body.roundName, body.scheduledAt],
  );
  return { data: result.rows[0] };
});

app.patch('/admin/matches/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    score: optionalText,
    roundName: z.string().trim().optional(),
    status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
    winnerId: optionalDbId,
    scheduledAt: optionalDate,
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE matches
      SET score = COALESCE($2, score),
          round_name = COALESCE($3, round_name),
          status = COALESCE($4::match_status, status),
          winner_id = COALESCE($5, winner_id),
          scheduled_at = COALESCE($6, scheduled_at),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.score, body.roundName ?? null, body.status ?? null, body.winnerId, body.scheduledAt],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
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
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
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
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      INSERT INTO clubs (name, address, city, phone, image_key)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [body.name, body.address, body.city, body.phone, body.imageKey],
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
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.name ?? null, body.address, body.city ?? null, body.phone, body.imageKey],
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

app.patch('/admin/listings/:id', async (request, reply) => {
  const admin = await requireAdmin(request, reply);
  if (!admin) return;

  const params = z.object({ id: dbId }).safeParse(request.params);
  if (!params.success) return reply.code(400).send({ error: 'bad_request' });
  const schema = z.object({
    title: z.string().trim().min(2).optional(),
    description: optionalText,
    category: z.string().trim().optional(),
    priceCents: z.coerce.number().int().min(0).optional(),
    status: z.enum(['draft', 'moderation', 'published', 'rejected', 'archived']).optional(),
  });
  const body = schema.parse(request.body);
  const result = await query(
    `
      UPDATE listings
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          price_cents = COALESCE($5, price_cents),
          status = COALESCE($6::listing_status, status),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [params.data.id, body.title ?? null, body.description, body.category ?? null, body.priceCents ?? null, body.status ?? null],
  );
  if (!result.rows[0]) return reply.code(404).send({ error: 'not_found' });
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

  if (body.sendNow && tokens.rows.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokens.rows.map((token) => ({
          to: token.expo_push_token,
          title: body.title,
          body: body.body,
          data: { source: 'fbs-admin' },
        })),
      ),
    });
  }

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
  return { data: { campaign: result.rows[0], recipients: tokens.rows.length } };
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
