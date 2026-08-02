import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, companies } from '@jobpilot/db';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const RawPostingSchema = z.object({
  compensationTierSummary: z.string().optional(),
  descriptionHtml: z.string().optional().default(''),
  externalLink: z.string().optional(),
  id: z.string(),
  isRemote: z.boolean().optional(),
  locationName: z.string().optional(),
  publishedDate: z.string().optional(),
  title: z.string(),
});

const ResponseSchema = z.object({
  jobPostings: z.array(z.unknown()).optional().default([]),
});

const fetchCompany = async (
  slug: string,
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const res = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
      { signal }
    );
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = ResponseSchema.parse(await res.json());

    return data.jobPostings.flatMap((raw) => {
      const p = RawPostingSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const j = p.data;

      const jobUrl =
        j.externalLink ?? `https://jobs.ashbyhq.com/${slug}/${j.id}`;
      const locationPolicy = j.isRemote ? 'Remote' : (j.locationName ?? null);

      const r = PipelineJobSchema.safeParse({
        company: slug,
        description: stripHtml(j.descriptionHtml),
        locationPolicy,
        postedAt: j.publishedDate ?? null,
        role: j.title,
        salaryInfo: j.compensationTierSummary ?? null,
        source: `ashby:${slug}`,
        url: jobUrl,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error(`[ashby:${slug}] fetch failed:`, err);
    return [];
  }
};

export const fetchAshby = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  const db = getDb();
  const rows = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.ats, 'ashby'));

  if (!rows.length) {
    return [];
  }

  const results: PipelineJob[] = [];
  for (let i = 0; i < rows.length; i += 5) {
    const batch = rows.slice(i, i + 5);
    const settled = await Promise.allSettled(
      batch.map((r) => fetchCompany(r.slug, signal))
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results.push(...s.value);
      }
    }
  }
  return results;
};
