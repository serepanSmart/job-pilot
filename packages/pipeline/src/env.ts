import { existsSync } from 'node:fs';
import path from 'node:path';

function findEnvFile(startDir: string): string | undefined {
  let dir = startDir;
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = path.join(dir, '.env');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return undefined;
}

const envFile = findEnvFile(process.cwd());
if (envFile) {
  process.loadEnvFile(envFile);
}
