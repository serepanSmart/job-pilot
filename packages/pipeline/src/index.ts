import './env';

import { hardFilter } from './filter';
import { filterUnseen, markSeen } from './dedupe';
import { autoGrow } from './auto-grow';
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
  newCompanies: number
): void {
  const COL_W = 18;
  const sep = '-'.repeat(COL_W + 30);
  const header = `${'Source'.padEnd(COL_W)} ${'Fetched'.padStart(8)} ${'Filtered'.padStart(9)} ${'New'.padStart(6)}`;

  console.info('\n[pipeline] %s', sep);
  console.info('[pipeline] %s', header);
  console.info('[pipeline] %s', sep);

  let totalFetched = 0;
  let totalFiltered = 0;
  let totalFresh = 0;

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
    console.info(
      '[pipeline] %s %s %s %s',
      key.padEnd(COL_W),
      String(row.fetched).padStart(8),
      String(row.filtered).padStart(9),
      String(row.fresh).padStart(6)
    );
    totalFetched += row.fetched;
    totalFiltered += row.filtered;
    totalFresh += row.fresh;
  }

  console.info('[pipeline] %s', sep);
  console.info(
    '[pipeline] %s %s %s %s',
    'TOTAL'.padEnd(COL_W),
    String(totalFetched).padStart(8),
    String(totalFiltered).padStart(9),
    String(totalFresh).padStart(6)
  );
  console.info('[pipeline] %s\n', sep);

  if (newCompanies > 0) {
    console.info(
      '[pipeline] Auto-grew companies table: +%d new ATS slug(s)',
      newCompanies
    );
  }
  console.info(
    '[pipeline] Done. %d new job(s) added to seen_hashes.',
    totalFresh
  );
}

async function run(): Promise<void> {
  console.info('[pipeline] Phase 2 - discovery (no LLM). Starting...');

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

  await markSeen(freshJobs);

  const freshByKey = new Map<SourceKey, number>();
  for (const job of freshJobs) {
    const key = displayKey(job.source);
    freshByKey.set(key, (freshByKey.get(key) ?? 0) + 1);
  }

  const funnel = new Map<SourceKey, FunnelRow>();
  const allKeys = new Set([
    ...fetchedByKey.keys(),
    ...filteredByKey.keys(),
    ...freshByKey.keys(),
  ]);
  for (const key of allKeys) {
    funnel.set(key, {
      fetched: fetchedByKey.get(key) ?? 0,
      filtered: filteredByKey.get(key) ?? 0,
      fresh: freshByKey.get(key) ?? 0,
    });
  }

  printFunnel(funnel, newCompanies);
}

await run();
