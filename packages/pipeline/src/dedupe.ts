import { createHash } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { getDb, seenHashes } from '@jobpilot/db';
import type { PipelineJob } from './types';

const LEVEL_RE =
  /\b(senior|sr\.?|lead|principal|staff|junior|jr\.?|mid|intermediate|associate)\b/gi;
const PUNCT_RE = /[^\w\s]/g;

const fuzzyRoleKey = (company: string, role: string): string => {
  const normRole = role
    .toLowerCase()
    .replace(LEVEL_RE, '')
    .replace(PUNCT_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${company.toLowerCase()}::${normRole}`;
};

export const dedupeInMemory = (jobs: PipelineJob[]): PipelineJob[] => {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = fuzzyRoleKey(j.company, j.role);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

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
