import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const RawJobSchema = z.object({
  company_name: z.string(),
  created_at: z.number().optional(),
  description: z.string().default(''),
  job_types: z.array(z.string()).optional().default([]),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  tags: z.array(z.string()).optional().default([]),
  title: z.string(),
  url: z.string(),
});

const ResponseSchema = z.object({
  data: z.array(z.unknown()),
});

export async function fetchArbeitnow(
  signal?: AbortSignal
): Promise<PipelineJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = ResponseSchema.parse(await res.json());

    return data.data.flatMap((raw) => {
      const p = RawJobSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const j = p.data;

      const locationPolicy = j.remote ? 'Remote' : (j.location ?? null);

      const r = PipelineJobSchema.safeParse({
        company: j.company_name,
        description: stripHtml(j.description),
        locationPolicy,
        postedAt: j.created_at ? new Date(j.created_at * 1000) : null,
        role: j.title,
        salaryInfo: null,
        source: 'arbeitnow',
        url: j.url,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error('[arbeitnow] fetch failed:', err);
    return [];
  }
}
