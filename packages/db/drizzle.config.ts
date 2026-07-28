import { defineConfig } from 'drizzle-kit';
import './src/load-env';

/**
 * `generate` works offline from the schema, so DATABASE_URL is optional here.
 * The commands that need it (`db:migrate`, `db:push`, `db:studio`) get it from
 * the repo-root `.env` via the import above. drizzle-kit raises its own error
 * if the URL is missing when it is actually required.
 */
export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
