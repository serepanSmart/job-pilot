import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';

const RawJobSchema = z.object({
  candidate_required_location: z.string().nullable().optional(),
  company_name: z.string(),
  description: z.string().default(''),
  publication_date: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  title: z.string(),
  url: z.string(),
});

const ResponseSchema = z.object({
  jobs: z.array(z.unknown()),
});

const SEARCH_TERMS = ['react', 'frontend', 'front-end'];

const fetchPage = async (
  search: string,
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  const url = `https://remotive.com/api/remote-jobs?category=software-dev&search=${encodeURIComponent(search)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = ResponseSchema.parse(await res.json());
  return data.jobs.flatMap((raw) => {
    const p = RawJobSchema.safeParse(raw);
    if (!p.success) {
      return [];
    }
    const j = p.data;
    const r = PipelineJobSchema.safeParse({
      company: j.company_name,
      description: j.description,
      locationPolicy: j.candidate_required_location ?? null,
      postedAt: j.publication_date ?? null,
      role: j.title,
      salaryInfo: j.salary ?? null,
      source: 'remotive',
      url: j.url,
    });
    return r.success ? [r.data] : [];
  });
};

export const fetchRemotive = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const pages = await Promise.all(
      SEARCH_TERMS.map((term) => fetchPage(term, signal).catch(() => []))
    );
    const seen = new Set<string>();
    return pages.flat().filter((job) => {
      if (seen.has(job.url)) {
        return false;
      }
      seen.add(job.url);
      return true;
    });
  } catch (err) {
    console.error('[remotive] fetch failed:', err);
    return [];
  }
};
