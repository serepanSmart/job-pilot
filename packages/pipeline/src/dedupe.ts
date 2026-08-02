import { createHash } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { getDb, seenHashes } from '@jobpilot/db';
import type { PipelineJob } from './types';

const BATCH = 500;

export const contentHash = (company: string, role: string): string => {
  const normalized = `${company}::${role}`.toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex');
};

export const filterUnseen = async (
  jobs: PipelineJob[]
): Promise<PipelineJob[]> => {
  if (!jobs.length) {
    return [];
  }

  const db = getDb();
  const jobsWithHashes = jobs.map((j) => ({
    hash: contentHash(j.company, j.role),
    job: j,
  }));
  const hashes = jobsWithHashes.map((jh) => jh.hash);

  const seen = new Set<string>();
  for (let i = 0; i < hashes.length; i += BATCH) {
    const batch = hashes.slice(i, i + BATCH);
    const rows = await db
      .select({ hash: seenHashes.hash })
      .from(seenHashes)
      .where(inArray(seenHashes.hash, batch));
    rows.forEach((r) => seen.add(r.hash));
  }

  return jobsWithHashes.filter((jh) => !seen.has(jh.hash)).map((jh) => jh.job);
};

export const markSeen = async (jobs: PipelineJob[]): Promise<void> => {
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
};
