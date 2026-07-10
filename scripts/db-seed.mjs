import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

function loadDotEnv() {
  const envPath = path.resolve('.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (process.env[key]) continue;
    process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
  }
}

loadDotEnv();

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://fbs:fbs_password@localhost:5433/fbs_astana';
const initDir = path.resolve('infra/postgres/init');
const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();

try {
  const files = (await readdir(initDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => {
      const aIsSeed = a.includes('seed');
      const bIsSeed = b.includes('seed');
      if (aIsSeed !== bIsSeed) return aIsSeed ? 1 : -1;
      return a.localeCompare(b);
    });

  await client.query('BEGIN');
  try {
    for (const file of files) {
      const sql = await readFile(path.join(initDir, file), 'utf8');
      console.log(`seed ${file}`);
      await client.query(sql);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
} finally {
  await client.end();
}
