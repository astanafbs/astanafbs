import pg from 'pg';

import { env } from './env.js';

export const db = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
});

export type DbUser = {
  id: string;
  firebase_uid: string | null;
  email: string | null;
  display_name: string;
  photo_url: string | null;
  city: string | null;
  role: string;
};

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return db.query<T>(text, params);
}

export async function closeDb() {
  await db.end();
}
