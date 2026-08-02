import {
  FUNNEL_STAGES,
  PIPELINE_STATUSES,
  getDb,
  jobs,
  type Job,
  type JobStatus,
} from '@jobpilot/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';

export const getInboxJobs = async (): Promise<Job[]> => {
  return getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'new'))
    .orderBy(desc(jobs.score), desc(jobs.dateFound));
};

export const getJob = async (id: string): Promise<Job | undefined> => {
  const rows = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  return rows[0];
};

export const getPipelineJobs = async (): Promise<Job[]> => {
  return getDb()
    .select()
    .from(jobs)
    .where(inArray(jobs.status, [...PIPELINE_STATUSES]))
    .orderBy(desc(jobs.score));
};

export type StatusCounts = Record<JobStatus, number>;

export interface WeeklyApplications {
  readonly count: number;
  readonly weekStart: string;
}

export interface Stats {
  readonly counts: StatusCounts;
  readonly funnel: readonly { count: number; stage: JobStatus }[];
  readonly total: number;
  readonly weekly: readonly WeeklyApplications[];
}

export const getStats = async (): Promise<Stats> => {
  const db = getDb();

  const [statusRows, weeklyRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int`, status: jobs.status })
      .from(jobs)
      .groupBy(jobs.status),
    db
      .select({
        count: sql<number>`count(*)::int`,
        weekStart: sql<string>`to_char(date_trunc('week', date_applied), 'YYYY-MM-DD')`,
      })
      .from(jobs)
      .where(sql`date_applied IS NOT NULL`)
      .groupBy(sql`date_trunc('week', date_applied)`)
      .orderBy(sql`date_trunc('week', date_applied)`),
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
    return { count, stage };
  });

  const weekly = weeklyRows.map((row) => ({
    count: row.count,
    weekStart: row.weekStart,
  }));

  return { counts, funnel, total, weekly };
};
