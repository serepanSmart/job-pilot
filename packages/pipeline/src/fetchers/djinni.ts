import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: false,
  trimValues: true,
});

const RawItemSchema = z.object({
  description: z.string().optional().default(''),
  guid: z.string().optional().default(''),
  link: z.string().optional().default(''),
  pubDate: z.string().optional(),
  title: z.string().optional().default(''),
});

const FEED_URLS = [
  'https://djinni.co/jobs/rss/?keywords=react&employment=remote',
  'https://djinni.co/jobs/rss/?keywords=frontend&employment=remote',
];

const extractJobId = (url: string): string => {
  const match = /\/jobs\/(\d+)-/.exec(url);
  return match?.[1] ?? '';
};

const extractCompany = (html: string): string | null => {
  const snippet = html.slice(0, 1000);
  const match =
    /(?:company|employer|client)[:\s]+([A-Za-z0-9][^\n<]{2,50})/i.exec(snippet);
  if (!match) {
    return null;
  }
  const candidate = match[1]
    .trim()
    .replace(/[&<>"]/g, '')
    .split('.')[0]
    .trim();
  if (candidate.length < 2 || candidate.length > 60) {
    return null;
  }
  return candidate;
};

const parseItems = (xml: string, seen: Set<string>): PipelineJob[] => {
  const feed = parser.parse(xml) as Record<string, unknown>;
  const channel = (feed['rss'] as Record<string, unknown> | undefined)?.[
    'channel'
  ];
  if (!channel) {
    return [];
  }
  const rawItems = (channel as Record<string, unknown>)['item'];
  if (!rawItems) {
    return [];
  }
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.flatMap((raw) => {
    const p = RawItemSchema.safeParse(raw);
    if (!p.success) {
      return [];
    }
    const item = p.data;

    const url = item.link || item.guid;
    if (!url || !url.startsWith('http')) {
      return [];
    }
    if (seen.has(url)) {
      return [];
    }
    seen.add(url);

    const role = item.title.trim();
    if (!role) {
      return [];
    }

    const jobId = extractJobId(url);
    const extracted = extractCompany(item.description);
    const company = extracted ?? (jobId ? `djinni-${jobId}` : 'Djinni');

    const r = PipelineJobSchema.safeParse({
      company,
      description: stripHtml(item.description),
      locationPolicy: null,
      postedAt: item.pubDate ?? null,
      role,
      salaryInfo: null,
      source: 'djinni',
      url,
    });
    return r.success ? [r.data] : [];
  });
};

export const fetchDjinni = async (
  signal?: AbortSignal
): Promise<PipelineJob[]> => {
  try {
    const responses = await Promise.all(
      FEED_URLS.map((url) =>
        fetch(url, { signal }).then((r) => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
          }
          return r.text();
        })
      )
    );

    const seen = new Set<string>();
    return responses.flatMap((xml) => parseItems(xml, seen));
  } catch (err) {
    console.error('[djinni] fetch failed:', err);
    return [];
  }
};
