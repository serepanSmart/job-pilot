import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, companies } from '@jobpilot/db';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const RawJobSchema = z.object({
  absolute_url: z.string(),
  content: z.string().optional().default(''),
  id: z.number(),
  offices: z
    .array(z.object({ name: z.string() }).passthrough())
    .optional()
    .default([]),
  title: z.string(),
  updated_at: z.string().optional(),
});

const ResponseSchema = z.object({
  jobs: z.array(z.unknown()),
});

async function fetchCompany(
  slug: string,
  signal?: AbortSignal
): Promise<PipelineJob[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      { signal }
    );
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = ResponseSchema.parse(await res.json());

    return data.jobs.flatMap((raw) => {
      const p = RawJobSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const j = p.data;

      const locationPolicy = j.offices.length
        ? j.offices.map((o) => o.name).join(', ')
        : null;

      const r = PipelineJobSchema.safeParse({
        company: slug,
        description: stripHtml(j.content),
        locationPolicy,
        postedAt: j.updated_at ?? null,
        role: j.title,
        salaryInfo: null,
        source: `greenhouse:${slug}`,
        url: j.absolute_url,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error(`[greenhouse:${slug}] fetch failed:`, err);
    return [];
  }
}

export async function fetchGreenhouse(
  signal?: AbortSignal
): Promise<PipelineJob[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.ats, 'greenhouse'));

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
}
