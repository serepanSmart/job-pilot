import { getDb, companies } from '@jobpilot/db';
import type { AtsProvider } from '@jobpilot/db';
import type { PipelineJob } from './types';

interface AtsMatch {
  ats: AtsProvider;
  slug: string;
}

const ATS_PATTERNS: { ats: AtsProvider; re: RegExp }[] = [
  { ats: 'greenhouse', re: /boards\.greenhouse\.io\/([^/?#]+)/ },
  { ats: 'lever', re: /jobs\.lever\.co\/([^/?#]+)/ },
  { ats: 'ashby', re: /jobs\.ashbyhq\.com\/([^/?#]+)/ },
];

export const extractAtsSlug = (url: string): AtsMatch | null => {
  for (const { ats, re } of ATS_PATTERNS) {
    const m = re.exec(url);
    if (m?.[1]) {
      return { ats, slug: m[1].toLowerCase() };
    }
  }
  return null;
};

export const autoGrow = async (
  jobs: PipelineJob[],
  addedFrom: string
): Promise<number> => {
  const candidates = new Map<string, AtsProvider>();

  for (const job of jobs) {
    const match = extractAtsSlug(job.url);
    if (match && !candidates.has(match.slug)) {
      candidates.set(match.slug, match.ats);
    }
  }

  if (!candidates.size) {
    return 0;
  }

  const db = getDb();
  const rows = Array.from(candidates.entries()).map(([slug, ats]) => ({
    addedFrom,
    ats,
    slug,
  }));

  const inserted = await db
    .insert(companies)
    .values(rows)
    .onConflictDoNothing()
    .returning();

  return inserted.length;
};
