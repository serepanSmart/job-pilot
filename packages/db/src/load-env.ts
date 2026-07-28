import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Side-effect module: loads the repo-root `.env` into process.env.
 *
 * drizzle-kit and tsx execute scripts directly, so nothing populates env for
 * us, and passing `--env-file` breaks as soon as npm hoists a binary. Import
 * this first in any script that needs DATABASE_URL.
 *
 * In CI there is no `.env` — values arrive as GitHub secrets — so a missing
 * file is not an error.
 */
function findEnvFile(startDir: string): string | undefined {
  let dir = startDir;

  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = path.join(dir, '.env');
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

const envFile = findEnvFile(process.cwd());

if (envFile) {
  process.loadEnvFile(envFile);
}
