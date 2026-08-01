import { z } from 'zod';
import { PipelineJobSchema } from '../types';
import type { PipelineJob } from '../types';
import { stripHtml } from '../utils';

const StoryHitSchema = z.object({
  created_at: z.string(),
  objectID: z.string(),
});

const StoriesResponseSchema = z.object({
  hits: z.array(z.unknown()),
});

const CommentHitSchema = z.object({
  comment_text: z.string().nullable().optional(),
  created_at: z.string().optional(),
  objectID: z.string(),
});

const CommentsResponseSchema = z.object({
  hits: z.array(z.unknown()),
  nbHits: z.number().optional(),
});

const REMOTE_RE = /\bremote\b/i;
const ROLE_RE = /frontend|front-end|front end|react|ui engineer|web engineer/i;

function parseComment(
  comment: z.infer<typeof CommentHitSchema>
): PipelineJob | null {
  const raw = comment.comment_text;
  if (!raw) {
    return null;
  }

  const text = stripHtml(raw);
  if (!REMOTE_RE.test(text) || !ROLE_RE.test(text)) {
    return null;
  }

  const firstLine = text.split('\n')[0] ?? '';
  const parts = firstLine.split('|').map((s) => s.trim());

  let company = parts[0] ?? '';
  company = company.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (!company) {
    return null;
  }

  const roleCandidate =
    parts.slice(1).find((p) => ROLE_RE.test(p)) ??
    parts[1] ??
    'Frontend Engineer';

  const url = `https://news.ycombinator.com/item?id=${comment.objectID}`;
  const descText = text.slice(0, 1500);
  const salaryPart = parts.find((p) => /\d{2,3}k|\$[\d,]+/i.test(p)) ?? null;

  const r = PipelineJobSchema.safeParse({
    company,
    description: descText,
    locationPolicy: 'Remote',
    postedAt: comment.created_at ?? null,
    role: roleCandidate,
    salaryInfo: salaryPart,
    source: 'hn-algolia',
    url,
  });
  return r.success ? r.data : null;
}

export async function fetchHNAlgolia(
  signal?: AbortSignal
): Promise<PipelineJob[]> {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (compatible; JobPilot/1.0; +https://github.com)',
    };
    const storiesRes = await fetch(
      'https://hn.algolia.com/api/v1/search?' +
        new URLSearchParams({
          hitsPerPage: '5',
          query: 'Ask HN: Who is hiring?',
          tags: 'story',
        }),
      { headers, signal }
    );
    if (!storiesRes.ok) {
      throw new Error(`HTTP ${storiesRes.status}`);
    }

    const storiesData = StoriesResponseSchema.parse(await storiesRes.json());
    const hits = storiesData.hits.flatMap((h) => {
      const p = StoryHitSchema.safeParse(h);
      return p.success ? [p.data] : [];
    });

    if (!hits.length) {
      return [];
    }

    const storyId = hits[0].objectID;

    const commentsRes = await fetch(
      'https://hn.algolia.com/api/v1/search?' +
        new URLSearchParams({
          hitsPerPage: '1000',
          tags: `comment,story_${storyId}`,
        }),
      { headers, signal }
    );
    if (!commentsRes.ok) {
      throw new Error(`HTTP ${commentsRes.status}`);
    }

    const commentsData = CommentsResponseSchema.parse(await commentsRes.json());

    return commentsData.hits.flatMap((raw) => {
      const p = CommentHitSchema.safeParse(raw);
      if (!p.success) {
        return [];
      }
      const job = parseComment(p.data);
      return job ? [job] : [];
    });
  } catch (err) {
    console.error('[hn-algolia] fetch failed:', err);
    return [];
  }
}
