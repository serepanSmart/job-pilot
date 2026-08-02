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
  title: z.string().optional().default(''),
});

const parseDOUTitle = (title: string): { company: string; role: string } => {
  const emDash = title.indexOf(' — ');
  if (emDash !== -1) {
    return {
      company: title.slice(emDash + 3).trim() || 'Unknown',
      role: title.slice(0, emDash).trim(),
    };
  }
  return { company: 'Unknown', role: title.trim() };
};

export const fetchDOU = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const res = await fetch(
      'https://jobs.dou.ua/vacancies/feeds/?category=Front+End',
      { signal }
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xml = await res.text();
    const feed = parser.parse(xml) as Record<string, unknown>;

    const rawItems: unknown[] = (() => {
      const rss = feed['rss'] as Record<string, unknown> | undefined;
      const channel = rss?.['channel'] as Record<string, unknown> | undefined;
      if (!channel) {
        return [];
      }
      const items = channel['item'];
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

      if (!item.title || !item.link.startsWith('http')) {
        return [];
      }

      const { company, role } = parseDOUTitle(item.title);
      const desc = stripHtml(item.description);

      const r = PipelineJobSchema.safeParse({
        company,
        description: desc,
        locationPolicy: null,
        postedAt: item.pubDate ?? null,
        role,
        salaryInfo: null,
        source: 'dou',
        url: item.link,
      });
      return r.success ? [r.data] : [];
    });
  } catch (err) {
    console.error('[dou] fetch failed:', err);
    return [];
  }
};
