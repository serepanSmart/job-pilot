import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { decodeHtmlEntities, stripHtml } from '../utils';

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: false,
  trimValues: true,
});

const RawItemSchema = z.object({
  description: z.string().optional().default(''),
  link: z.string().optional().default(''),
  pubDate: z.string().optional(),
  title: z.string().optional().default(''),
});

const parseDOUTitle = (raw: string): { company: string; role: string } => {
  const title = decodeHtmlEntities(raw);

  const tryExtract = (
    sep: string,
    width: number
  ): { company: string; role: string } | null => {
    const idx = title.indexOf(sep);
    if (idx === -1) return null;
    const role = title.slice(0, idx).trim();
    let company = title.slice(idx + width).trim();
    const metaIdx = company.search(/, від /i);
    if (metaIdx !== -1) company = company.slice(0, metaIdx).trim();
    if (!role || !company) return null;
    return { company, role };
  };

  return (
    tryExtract(' — ', 3) ??
    tryExtract(' в ', 3) ?? { company: 'Unknown', role: title.trim() }
  );
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
