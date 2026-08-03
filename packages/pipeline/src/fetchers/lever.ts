import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, companies } from '@jobpilot/db';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { slugToDisplayName, stripHtml } from '../utils';

const RawPostingSchema = z.object({
  applyUrl: z.string().optional(),
  categories: z
    .object({
      commitment: z.string().optional(),
      location: z.string().optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  createdAt: z.number().optional(),
  description: z.string().optional().default(''),
  descriptionPlain: z.string().optional(),
  hostedUrl: z.string(),
  id: z.string(),
  text: z.string(),
});

const fetchCompany = async (
  slug: string,
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { signal }
    );
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = z.array(z.unknown()).parse(await res.json());

    return data.flatMap((raw) => {
      const p = RawPostingSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const j = p.data;

      const desc = j.descriptionPlain ?? stripHtml(j.description);

      const r = PipelineJobSchema.safeParse({
        company: slugToDisplayName(slug),
        description: desc,
        locationPolicy: j.categories.location ?? null,
        postedAt: j.createdAt ? new Date(j.createdAt) : null,
        role: j.text,
        salaryInfo: null,
        source: `lever:${slug}`,
        url: j.hostedUrl,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error(`[lever:${slug}] fetch failed:`, err);
    return [];
  }
};

export const fetchLever = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  const db = getDb();
  const rows = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.ats, 'lever'));

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
