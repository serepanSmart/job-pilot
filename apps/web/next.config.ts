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
  transpilePackages: ['@jobpilot/db'],

  turbopack: {
    root: workspaceRoot,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
