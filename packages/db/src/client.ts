import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { readDbEnv } from './env';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

const createDb = () => {
  const { DATABASE_URL } = readDbEnv();
  return drizzle(neon(DATABASE_URL), { schema });
};

let cached: Database | undefined;

/**
 * Lazily created singleton. Lazy matters twice over: `next build` imports
 * modules that transitively reach this file without DATABASE_URL set, and
 * serverless invocations should reuse the client across warm starts.
 */
export const getDb = (): Database => {
  cached ??= createDb();
  return cached;
};
