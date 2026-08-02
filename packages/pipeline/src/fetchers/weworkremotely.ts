import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

const RawItemSchema = z.object({
  description: z.string().optional().default(''),
  link: z.string().optional().default(''),
  pubDate: z.string().optional(),
  region: z.string().optional(),
  title: z.string().optional().default(''),
});

const parseTitle = (raw: string): { company: string; role: string } | null => {
  const colon = raw.indexOf(':');
  if (colon === -1) {
    return null;
  }
  const company = raw.slice(0, colon).trim();
  const role = raw.slice(colon + 1).trim();
  if (!company || !role) {
    return null;
  }
  return { company, role };
};

export const fetchWeWorkRemotely = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const res = await fetch(
      'https://weworkremotely.com/categories/remote-programming-jobs.rss',
      { signal }
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xml = await res.text();
    const feed = parser.parse(xml) as Record<string, unknown>;

    const rawItems: unknown[] = (() => {
      const channel = (feed['rss'] as Record<string, unknown>)?.['channel'];
      if (!channel) {
        return [];
      }
      const items = (channel as Record<string, unknown>)['item'];
      if (!items) {
        return [];
      }
      return Array.isArray(items) ? items : [items];
    })();

    return rawItems.flatMap((raw) => {
      const p = RawItemSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const item = p.data;

      const parsed = parseTitle(item.title);
      if (!parsed) {
        return [];
      }

      const url = item.link;
      if (!url || !url.startsWith('http')) {
        return [];
      }

      const r = PipelineJobSchema.safeParse({
        company: parsed.company,
        description: stripHtml(item.description),
        locationPolicy: item.region ?? 'Worldwide',
        postedAt: item.pubDate ?? null,
        role: parsed.role,
        salaryInfo: null,
        source: 'weworkremotely',
        url,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error('[weworkremotely] fetch failed:', err);
    return [];
  }
};
