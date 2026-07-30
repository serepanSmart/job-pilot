import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const RawJobSchema = z.object({
  apply_url: z.string().optional(),
  company: z.string(),
  description: z.string().optional().default(''),
  epoch: z.number().optional(),
  location: z.string().optional(),
  position: z.string(),
  salary_max: z.number().nullable().optional(),
  salary_min: z.number().nullable().optional(),
  url: z.string().optional(),
});

export async function fetchRemoteOK(
  signal?: AbortSignal
): Promise<PipelineJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobPilot/1.0 (personal job search tool)' },
      signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = z.array(z.unknown()).parse(await res.json());
    const items = data.slice(1);

    return items.flatMap((raw) => {
      const p = RawJobSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const j = p.data;

      const jobUrl = j.apply_url ?? j.url;
      if (!jobUrl) {
        return [];
      }

      let salaryInfo: string | null = null;
      if (j.salary_min && j.salary_max) {
        salaryInfo = `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}`;
      } else if (j.salary_min) {
        salaryInfo = `$${j.salary_min.toLocaleString()}+`;
      }

      const r = PipelineJobSchema.safeParse({
        company: j.company,
        description: stripHtml(j.description ?? ''),
        locationPolicy: j.location ?? null,
        postedAt: j.epoch ? new Date(j.epoch * 1000) : null,
        role: j.position,
        salaryInfo,
        source: 'remoteok',
        url: jobUrl,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error('[remoteok] fetch failed:', err);
    return [];
  }
}
