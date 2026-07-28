import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

const workspaceRoot = path.join(import.meta.dirname, '..', '..');

// Next only reads .env from its own project directory (apps/web), but this
// monorepo keeps one .env at the root so the pipeline and the web app share it.
// On Vercel the variables come from project settings and no .env exists.
const rootEnv = path.join(workspaceRoot, '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const nextConfig: NextConfig = {
  // @jobpilot/db is consumed as TypeScript source (no build step).
  transpilePackages: ['@jobpilot/db'],

  // Pin the workspace root. Without this, Next walks up past the repo and can
  // latch onto an unrelated lockfile in the user's home directory.
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
