import { getDb, jobs } from '@jobpilot/db';
import type { Job, NewJob } from '@jobpilot/db';
import { contentHash } from './dedupe';
import type { ScoredJob } from './types';

export const insertScoredJobs = async (
  scoredJobs: ScoredJob[]
): Promise<Job[]> => {
  if (!scoredJobs.length) {
    return [];
  }

  const db = getDb();

  const toInsert: NewJob[] = scoredJobs.map((j) => ({
    company: j.company,
    contentHash: contentHash(j.company, j.role),
    description: j.description,
    locationPolicy: j.locationPolicy,
    matchedKeywords: j.matchedKeywords,
    missingKeywords: j.missingKeywords,
    redFlags: j.redFlags,
    role: j.role,
    salaryInfo: j.salaryInfo,
    score: j.score,
    source: j.source,
    timezoneFit: j.timezoneFit,
    url: j.url,
    verdict: j.oneLineVerdict,
  }));

  return db.insert(jobs).values(toInsert).onConflictDoNothing().returning();
};
