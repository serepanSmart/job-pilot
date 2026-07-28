import {
  FUNNEL_STAGES,
  PIPELINE_STATUSES,
  getDb,
  jobs,
  type Job,
  type JobStatus,
} from '@jobpilot/db';
import { desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';

/** Inbox: untriaged jobs, best score first. */
export async function getInboxJobs(): Promise<Job[]> {
  return getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'new'))
    .orderBy(desc(jobs.score), desc(jobs.dateFound));
}

export async function getJob(id: string): Promise<Job | undefined> {
  const rows = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  return rows[0];
}

/** Everything shown on the kanban, i.e. excluding rejected/archived. */
export async function getPipelineJobs(): Promise<Job[]> {
  return getDb()
    .select()
    .from(jobs)
    .where(inArray(jobs.status, [...PIPELINE_STATUSES]))
    .orderBy(desc(jobs.score));
}

export type StatusCounts = Record<JobStatus, number>;

export interface WeeklyApplications {
  /** ISO date of the Monday starting that week. */
  readonly weekStart: string;
  readonly count: number;
}

export interface Stats {
  readonly counts: StatusCounts;
  readonly total: number;
  readonly funnel: readonly { stage: JobStatus; count: number }[];
  readonly weekly: readonly WeeklyApplications[];
}

function mondayOf(date: Date): string {
  const copy = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // getUTCDay(): 0 = Sunday, so shift Sunday back a full week.
  const offset = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - offset);
  return copy.toISOString().slice(0, 10);
}

export async function getStats(): Promise<Stats> {
  const db = getDb();

  const [statusRows, appliedRows] = await Promise.all([
    db
      .select({ status: jobs.status, count: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.status),
    db
      .select({ dateApplied: jobs.dateApplied })
      .from(jobs)
      .where(isNotNull(jobs.dateApplied)),
  ]);

  const counts = Object.fromEntries(
    (
      [
        'new',
        'shortlisted',
        'tailored',
        'applied',
        'screening',
        'interview',
        'offer',
        'rejected',
        'archived',
      ] as const
    ).map((status) => [status, 0])
  ) as StatusCounts;

  let total = 0;
  for (const row of statusRows) {
    counts[row.status] = row.count;
    total += row.count;
  }

  // The funnel is cumulative: everyone who interviewed also applied, so each
  // stage counts every job that reached it *or beyond*.
  const stageOrder: readonly JobStatus[] = [
    'applied',
    'screening',
    'interview',
    'offer',
  ];
  const funnel = FUNNEL_STAGES.map((stage) => {
    const fromIndex = stageOrder.indexOf(stage);
    const count = stageOrder
      .slice(fromIndex)
      .reduce((sum, later) => sum + counts[later], 0);
    return { stage, count };
  });

  const buckets = new Map<string, number>();
  for (const row of appliedRows) {
    if (!row.dateApplied) continue;
    const week = mondayOf(row.dateApplied);
    buckets.set(week, (buckets.get(week) ?? 0) + 1);
  }

  const weekly = [...buckets.entries()]
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return { counts, total, funnel, weekly };
}
