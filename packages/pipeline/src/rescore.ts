import './env';
import { eq } from 'drizzle-orm';
import { SCORE_THRESHOLD, getDb, jobs } from '@jobpilot/db';
import type { PipelineJob } from './types';
import { scoreJob } from './scorer';

const TARGET_SCORE = 72;

const toJob = (row: typeof jobs.$inferSelect): PipelineJob => ({
  company: row.company,
  description: row.description,
  locationPolicy: row.locationPolicy,
  postedAt: null,
  role: row.role,
  salaryInfo: row.salaryInfo,
  source: row.source,
  url: row.url,
});

async function rescore(): Promise<void> {
  const db = getDb();

  const rows = await db.select().from(jobs).where(eq(jobs.score, TARGET_SCORE));

  if (!rows.length) {
    console.info('[rescore] no jobs with score=%d found', TARGET_SCORE);
    return;
  }

  console.info('[rescore] re-scoring %d jobs…', rows.length);

  let updated = 0;
  let archived = 0;
  let failed = 0;

  for (const row of rows) {
    await new Promise((r) => setTimeout(r, 12000));
    const result = await scoreJob(toJob(row));

    if (result === null) {
      console.warn(
        '[rescore] scorer returned null for %s / %s',
        row.company,
        row.role
      );
      failed += 1;
      continue;
    }

    const newStatus =
      result.score < SCORE_THRESHOLD ? ('archived' as const) : row.status;

    await db
      .update(jobs)
      .set({
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
        redFlags: result.redFlags,
        score: result.score,
        status: newStatus,
        timezoneFit: result.timezoneFit,
        updatedAt: new Date(),
        verdict: result.oneLineVerdict,
      })
      .where(eq(jobs.id, row.id));

    let arrow: string;
    if (result.score > TARGET_SCORE) {
      arrow = '↑';
    } else if (result.score < TARGET_SCORE) {
      arrow = '↓';
    } else {
      arrow = '=';
    }
    const label = `${row.company} / ${row.role}`.slice(0, 42).padEnd(42);
    const archivedTag = newStatus === 'archived' ? ' (archived)' : '';
    console.info(
      `[rescore] ${label} ${TARGET_SCORE} → ${result.score} ${arrow}${archivedTag}`
    );

    updated += 1;
    if (newStatus === 'archived') {
      archived += 1;
    }
  }

  console.info(
    '[rescore] done — updated: %d, archived: %d, failed: %d',
    updated,
    archived,
    failed
  );
}

await rescore();
