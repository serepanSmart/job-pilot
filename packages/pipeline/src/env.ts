import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const findEnvFile = (startDir: string): string | undefined => {
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
};

const loadEnvFileOverride = (filePath: string): void => {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      val.length >= 2 &&
      ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")))
    ) {
      val = val.slice(1, -1);
    }
    if (key) {
      process.env[key] = val;
    }
  }
};

const envFile = findEnvFile(process.cwd());
if (envFile) {
  loadEnvFileOverride(envFile);
}
