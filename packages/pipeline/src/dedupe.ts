import { createHash } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { getDb, seenHashes } from '@jobpilot/db';
import type { PipelineJob } from './types';

const BATCH = 500;

export function contentHash(company: string, role: string): string {
  const normalized = `${company}::${role}`.toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex');
}

export async function filterUnseen(
  jobs: PipelineJob[]
): Promise<PipelineJob[]> {
  if (!jobs.length) {
    return [];
  }

  const db = getDb();
  const hashes = jobs.map((j) => contentHash(j.company, j.role));

  const seen = new Set<string>();
  for (let i = 0; i < hashes.length; i += BATCH) {
    const batch = hashes.slice(i, i + BATCH);
    const rows = await db
      .select({ hash: seenHashes.hash })
      .from(seenHashes)
      .where(inArray(seenHashes.hash, batch));
    rows.forEach((r) => seen.add(r.hash));
  }

  return jobs.filter((j) => !seen.has(contentHash(j.company, j.role)));
}

export async function markSeen(jobs: PipelineJob[]): Promise<void> {
  if (!jobs.length) {
    return;
  }

  const db = getDb();
  const rows = jobs.map((j) => ({ hash: contentHash(j.company, j.role) }));

  for (let i = 0; i < rows.length; i += BATCH) {
    await db
      .insert(seenHashes)
      .values(rows.slice(i, i + BATCH))
      .onConflictDoNothing();
  }
}
