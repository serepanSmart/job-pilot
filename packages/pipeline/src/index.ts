import './env';

import { SCORE_THRESHOLD } from '@jobpilot/db';
import { hardFilter } from './filter';
import { filterUnseen, markSeen } from './dedupe';
import { autoGrow } from './auto-grow';
import { sendDigest } from './digest';
import { insertScoredJobs } from './insert';
import { scoreBatch } from './scorer';
import { fetchRemotive } from './fetchers/remotive';
import { fetchRemoteOK } from './fetchers/remoteok';
import { fetchArbeitnow } from './fetchers/arbeitnow';
import { fetchWeWorkRemotely } from './fetchers/weworkremotely';
import { fetchHNAlgolia } from './fetchers/hn-algolia';
import { fetchDOU } from './fetchers/dou';
import { fetchGreenhouse } from './fetchers/greenhouse';
import { fetchLever } from './fetchers/lever';
import { fetchAshby } from './fetchers/ashby';
import type { PipelineJob } from './types';

type SourceKey =
  | 'remotive'
  | 'remoteok'
  | 'arbeitnow'
  | 'weworkremotely'
  | 'hn-algolia'
  | 'dou'
  | 'greenhouse'
  | 'lever'
  | 'ashby';

interface FunnelRow {
  fetched: number;
  filtered: number;
  fresh: number;
  inserted?: number;
  scored?: number;
}

function displayKey(source: string): SourceKey {
  if (source.startsWith('greenhouse:')) {
    return 'greenhouse';
  }
  if (source.startsWith('lever:')) {
    return 'lever';
  }
  if (source.startsWith('ashby:')) {
    return 'ashby';
  }
  return source as SourceKey;
}

function isAggregator(source: string): boolean {
  return !['greenhouse', 'lever', 'ashby'].some((ats) =>
    source.startsWith(`${ats}:`)
  );
}

function printFunnel(
  funnel: Map<SourceKey, FunnelRow>,
  newCompanies: number,
  withScoring: boolean
): void {
  const COL_W = 18;
  const extraCols = withScoring ? '  Scored  Inserted' : '';
  const sep = '-'.repeat(COL_W + 30 + (withScoring ? 18 : 0));
  const header = `${'Source'.padEnd(COL_W)} ${'Fetched'.padStart(8)} ${'Filtered'.padStart(9)} ${'New'.padStart(6)}${extraCols}`;

  console.info('\n[pipeline] %s', sep);
  console.info('[pipeline] %s', header);
  console.info('[pipeline] %s', sep);

  let totalFetched = 0;
  let totalFiltered = 0;
  let totalFresh = 0;
  let totalScored = 0;
  let totalInserted = 0;

  const ORDER: SourceKey[] = [
    'remotive',
    'remoteok',
    'arbeitnow',
    'weworkremotely',
    'hn-algolia',
    'dou',
    'greenhouse',
    'lever',
    'ashby',
  ];

  for (const key of ORDER) {
    const row = funnel.get(key);
    if (!row) {
      continue;
    }
    const scoringCols = withScoring
      ? `  ${String(row.scored ?? 0).padStart(6)}  ${String(row.inserted ?? 0).padStart(8)}`
      : '';
    console.info(
      '[pipeline] %s %s %s %s%s',
      key.padEnd(COL_W),
      String(row.fetched).padStart(8),
      String(row.filtered).padStart(9),
      String(row.fresh).padStart(6),
      scoringCols
    );
    totalFetched += row.fetched;
    totalFiltered += row.filtered;
    totalFresh += row.fresh;
    totalScored += row.scored ?? 0;
    totalInserted += row.inserted ?? 0;
  }

  console.info('[pipeline] %s', sep);
  const totalScoringCols = withScoring
    ? `  ${String(totalScored).padStart(6)}  ${String(totalInserted).padStart(8)}`
    : '';
  console.info(
    '[pipeline] %s %s %s %s%s',
    'TOTAL'.padEnd(COL_W),
    String(totalFetched).padStart(8),
    String(totalFiltered).padStart(9),
    String(totalFresh).padStart(6),
    totalScoringCols
  );
  console.info('[pipeline] %s\n', sep);

  if (newCompanies > 0) {
    console.info(
      '[pipeline] Auto-grew companies table: +%d new ATS slug(s)',
      newCompanies
    );
  }

  if (withScoring) {
    console.info(
      '[pipeline] Done. %d scored, %d inserted into jobs.',
      totalScored,
      totalInserted
    );
  } else {
    console.info(
      '[pipeline] Done. %d new job(s) added to seen_hashes.',
      totalFresh
    );
  }
}

async function run(): Promise<void> {
  console.info('[pipeline] Starting...');

  const hasToken = Boolean(process.env['JOBPILOT_CODEMIE_TOKEN']);

  if (!hasToken) {
    console.warn(
      '[pipeline] JOBPILOT_CODEMIE_TOKEN not set — scoring skipped, jobs will not be inserted'
    );
  }

  const controller = new AbortController();
  const { signal } = controller;

  const [
    remotiveJobs,
    remoteokJobs,
    arbeitnowJobs,
    wwrJobs,
    hnJobs,
    douJobs,
    greenhouseJobs,
    leverJobs,
    ashbyJobs,
  ] = await Promise.all([
    fetchRemotive(signal),
    fetchRemoteOK(signal),
    fetchArbeitnow(signal),
    fetchWeWorkRemotely(signal),
    fetchHNAlgolia(signal),
    fetchDOU(signal),
    fetchGreenhouse(signal),
    fetchLever(signal),
    fetchAshby(signal),
  ]);

  const allFetched: PipelineJob[] = [
    ...remotiveJobs,
    ...remoteokJobs,
    ...arbeitnowJobs,
    ...wwrJobs,
    ...hnJobs,
    ...douJobs,
    ...greenhouseJobs,
    ...leverJobs,
    ...ashbyJobs,
  ];

  const fetchedByKey = new Map<SourceKey, number>();
  for (const job of allFetched) {
    const key = displayKey(job.source);
    fetchedByKey.set(key, (fetchedByKey.get(key) ?? 0) + 1);
  }

  const aggregatorJobs = allFetched.filter((j) => isAggregator(j.source));
  const newCompanies = await autoGrow(aggregatorJobs, 'auto-grow');

  const filtered = allFetched.filter(hardFilter);

  const filteredByKey = new Map<SourceKey, number>();
  for (const job of filtered) {
    const key = displayKey(job.source);
    filteredByKey.set(key, (filteredByKey.get(key) ?? 0) + 1);
  }

  const freshJobs = await filterUnseen(filtered);

  const freshByKey = new Map<SourceKey, number>();
  for (const job of freshJobs) {
    const key = displayKey(job.source);
    freshByKey.set(key, (freshByKey.get(key) ?? 0) + 1);
  }

  const scoredByKey = new Map<SourceKey, number>();
  const insertedByKey = new Map<SourceKey, number>();
  let insertedJobs: {
    company: string;
    id: string;
    role: string;
    score: number | null;
    verdict: string | null;
  }[] = [];

  if (hasToken && freshJobs.length > 0) {
    console.info('[pipeline] Scoring %d fresh jobs...', freshJobs.length);

    const scoreResults = await scoreBatch(freshJobs);

    const toInsert = freshJobs.flatMap((job, i) => {
      const result = scoreResults[i];
      if (result === null || result === undefined) {
        return [];
      }
      const key = displayKey(job.source);
      scoredByKey.set(key, (scoredByKey.get(key) ?? 0) + 1);
      const pass = result.score >= SCORE_THRESHOLD;
      console.info(
        '[score] %s | %s @ %s — %d%s',
        pass ? '✓' : '✗',
        job.role.slice(0, 40),
        job.company.slice(0, 25),
        result.score,
        pass ? '' : ` (${result.oneLineVerdict.slice(0, 60)})`
      );
      if (pass) {
        return [{ ...job, ...result }];
      }
      return [];
    });

    if (toInsert.length > 0) {
      const rows = await insertScoredJobs(toInsert);
      insertedJobs = rows.map((r) => ({
        company: r.company,
        id: r.id,
        role: r.role,
        score: r.score,
        verdict: r.verdict,
      }));
      for (const job of rows) {
        const key = displayKey(job.source);
        insertedByKey.set(key, (insertedByKey.get(key) ?? 0) + 1);
      }
      console.info('[pipeline] Inserted %d jobs into jobs table', rows.length);
    }
  }

  await markSeen(freshJobs);

  const funnel = new Map<SourceKey, FunnelRow>();
  const allKeys = new Set([
    ...fetchedByKey.keys(),
    ...filteredByKey.keys(),
    ...freshByKey.keys(),
    ...(hasToken ? scoredByKey.keys() : []),
    ...(hasToken ? insertedByKey.keys() : []),
  ]);
  for (const key of allKeys) {
    funnel.set(key, {
      fetched: fetchedByKey.get(key) ?? 0,
      filtered: filteredByKey.get(key) ?? 0,
      fresh: freshByKey.get(key) ?? 0,
      ...(hasToken
        ? {
            inserted: insertedByKey.get(key) ?? 0,
            scored: scoredByKey.get(key) ?? 0,
          }
        : {}),
    });
  }

  printFunnel(funnel, newCompanies, hasToken);

  await sendDigest(insertedJobs);
}

await run();
