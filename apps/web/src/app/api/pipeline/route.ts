import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';

const repoRoot = path.resolve(process.cwd(), '../..');
export const LOG_PATH = path.join(repoRoot, 'pipeline-last-run.log');

export const GET = async (): Promise<NextResponse> => {
  const { readFile } = await import('node:fs/promises');
  try {
    const raw = await readFile(LOG_PATH, 'utf8');
    const log = raw.replaceAll('\x00', '').slice(-4000);
    return NextResponse.json({ log });
  } catch {
    return NextResponse.json({ log: '' });
  }
};

export const POST = async (): Promise<NextResponse> => {
  const out = createWriteStream(LOG_PATH, { flags: 'w' });

  await new Promise<void>((resolve, reject) => {
    out.on('open', resolve);
    out.on('error', reject);
  });

  const child = spawn('npm', ['run', 'pipeline'], {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env },
  });

  child.unref();

  return NextResponse.json({ ok: true }, { status: 202 });
};
