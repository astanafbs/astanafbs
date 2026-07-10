import admin from 'firebase-admin';
import { FastifyReply, FastifyRequest } from 'fastify';

import { DbUser, query } from './db.js';
import { env } from './env.js';

let firebaseInitialized = false;

function ensureFirebase() {
  if (firebaseInitialized || admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }

  admin.initializeApp(
    env.firebaseProjectId
      ? {
          projectId: env.firebaseProjectId,
        }
      : undefined,
  );
  firebaseInitialized = true;
}

export type AuthIdentity = {
  firebaseUid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
};

export async function verifyBearerToken(request: FastifyRequest): Promise<AuthIdentity | null> {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    return null;
  }

  if (env.allowDevAuth && token.startsWith('dev:')) {
    const uid = token.slice('dev:'.length) || 'local-dev-user';
    return {
      firebaseUid: uid,
      email: `${uid}@local.fbs`,
      displayName: 'Local FBS Player',
    };
  }

  ensureFirebase();
  const decoded = await admin.auth().verifyIdToken(token);
  return {
    firebaseUid: decoded.uid,
    email: decoded.email,
    displayName: decoded.name,
    photoUrl: decoded.picture,
  };
}

export async function upsertUser(identity: AuthIdentity) {
  const result = await query<DbUser>(
    `
      INSERT INTO users (firebase_uid, email, display_name, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = COALESCE(EXCLUDED.email, users.email),
        display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), users.display_name),
        photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
        updated_at = now()
      RETURNING *
    `,
    [
      identity.firebaseUid,
      identity.email ?? null,
      identity.displayName ?? identity.email ?? 'FBS Player',
      identity.photoUrl ?? null,
    ],
  );

  const user = result.rows[0];
  await query(
    `
      INSERT INTO player_profiles (user_id, rating, rating_source)
      VALUES ($1, 0, 'local')
      ON CONFLICT DO NOTHING
    `,
    [user.id],
  );

  await query(
    `
      INSERT INTO user_entitlements (user_id, feature, starts_at, ends_at, status)
      VALUES
        ($1, 'app_access', now(), now() + interval '30 days', 'active'),
        ($1, 'stream_watch', now(), now() + interval '30 days', 'active'),
        ($1, 'listing_publish', now(), now() + interval '7 days', 'active')
      ON CONFLICT (user_id, feature) DO NOTHING
    `,
    [user.id],
  );

  return user;
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const identity = await verifyBearerToken(request);

  if (!identity) {
    reply.code(401).send({ error: 'unauthorized', message: 'Authorization token is required' });
    return null;
  }

  return upsertUser(identity);
}
