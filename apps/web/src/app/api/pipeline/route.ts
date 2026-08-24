import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export const maxDuration = 300;

export const POST = async (): Promise<NextResponse> => {
  const repoRoot = path.resolve(process.cwd(), '../..');
  try {
    const { stdout, stderr } = await execAsync('npm run pipeline', {
      cwd: repoRoot,
      timeout: 290_000,
      maxBuffer: 1024 * 1024,
    });
    const output = (stdout + stderr).trim();
    return NextResponse.json({ ok: true, output: output.slice(-3000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
