import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { PipelineJob, ScoreResult } from './types';

const MODEL = 'gemini-2.0-flash';
const BATCH_SIZE = 5;
const MAX_DESC_CHARS = 3000;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CV_PATH = path.resolve(DIR, '../../../data/cv-master.md');

let cvCache: string | null = null;
let apiKey: string | null = null;

function loadCv(): string {
  if (cvCache === null) {
    cvCache = readFileSync(CV_PATH, 'utf8');
  }
  return cvCache;
}

function initApiKey(): void {
  if (apiKey !== null) {
    return;
  }
  const key = process.env['GEMINI_API_KEY'];
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  apiKey = key;
  console.info('[scorer] model=%s', MODEL);
}

const RawScoreSchema = z.object({
  matched_keywords: z.array(z.string()).default([]),
  missing_keywords: z.array(z.string()).default([]),
  one_line_verdict: z.string().default(''),
  red_flags: z.array(z.string()).default([]),
  score: z.number().int().min(0).max(100),
  timezone_fit: z.enum(['bad', 'good', 'ok']).default('ok'),
});

const SYSTEM_PROMPT = `You score job postings against a candidate CV to determine fit.
Return ONLY a valid JSON object - no markdown, no explanation, no extra text.

JSON schema (exact field names required):
{
  "score": <integer 0-100>,
  "matched_keywords": <string[]>,
  "missing_keywords": <string[]>,
  "red_flags": <string[]>,
  "timezone_fit": <"good" | "ok" | "bad">,
  "one_line_verdict": <string max 120 chars, use hyphens not em-dashes>
}

Scoring scale:
- 80-100: Excellent fit - core skills present, EU/global remote, timezone OK
- 65-79: Good fit - most skills match, minor gaps acceptable
- 0-64: Poor fit - major skill gaps, location blockers, or hard constraints

timezone_fit values:
- "good": EU or global remote, UTC+2 compatible, no strict overlap requirement
- "ok": global remote with loose overlap that candidate can adapt to, or unspecified
- "bad": US timezone required, PST/EST 9-5 mandatory, or overlap with US business hours required

Known gaps - NEVER score these as matched skills:
GraphQL, Angular, Vue, Svelte, Node.js backend production experience,
AWS beyond Essentials certification, Cypress/Playwright E2E testing.
If the job requires any of these, list them in missing_keywords.`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT + '\n\nCandidate CV:\n' + loadCv();
}

function buildUserMessage(job: PipelineJob): string {
  return `Job: ${job.role} at ${job.company}
Source: ${job.source}
Location policy: ${job.locationPolicy ?? 'not specified'}
Salary: ${job.salaryInfo ?? 'not disclosed'}

Description (first ${MAX_DESC_CHARS} chars):
${job.description.slice(0, MAX_DESC_CHARS)}`;
}

async function callApi(job: PipelineJob): Promise<string> {
  if (apiKey === null) {
    throw new Error('apiKey not initialised');
  }
  const resp = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { content: buildSystemPrompt(), role: 'system' },
        { content: buildUserMessage(job), role: 'user' },
      ],
      max_tokens: 512,
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`${resp.status} ${body}`);
  }

  const data = (await resp.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message.content ?? '';
}

export async function scoreJob(job: PipelineJob): Promise<ScoreResult | null> {
  try {
    initApiKey();
    const text = await callApi(job);
    const raw = RawScoreSchema.parse(JSON.parse(text));

    return {
      matchedKeywords: raw.matched_keywords,
      missingKeywords: raw.missing_keywords,
      oneLineVerdict: raw.one_line_verdict.slice(0, 120),
      redFlags: raw.red_flags,
      score: raw.score,
      timezoneFit: raw.timezone_fit,
    };
  } catch (err) {
    console.error(
      `[scorer] failed for ${job.company} / ${job.role}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function scoreBatch(
  jobs: PipelineJob[]
): Promise<(ScoreResult | null)[]> {
  if (!jobs.length) {
    return [];
  }

  const results: (ScoreResult | null)[] = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(scoreJob));
    results.push(...batchResults);
    console.info(
      '[scorer] %d/%d scored',
      Math.min(i + BATCH_SIZE, jobs.length),
      jobs.length
    );
  }

  return results;
}
