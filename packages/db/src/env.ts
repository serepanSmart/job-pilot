import { z } from 'zod';

/**
 * Env vars are an IO boundary, so they get parsed, not trusted.
 * Kept lazy: importing this module must not throw, because the web app imports
 * schema types at build time when DATABASE_URL is not necessarily present.
 */
const dbEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is empty')
    .refine(
      (value) =>
        value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must be a postgres:// or postgresql:// connection string'
    ),
});

export type DbEnv = z.infer<typeof dbEnvSchema>;

export const readDbEnv = (): DbEnv => {
  const parsed = dbEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid database environment:\n${issues}\n\n` +
        'Copy .env.example to .env and set DATABASE_URL to your Neon pooled ' +
        'connection string.'
    );
  }

  return parsed.data;
};
