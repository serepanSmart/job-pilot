import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { PipelineJob, ScoreResult } from './types';

const MODEL = 'llama-3.1-8b-instant';
const BATCH_SIZE = 5;
const MAX_DESC_CHARS = 1200;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CV_PATH = path.resolve(DIR, '../../../data/cv-master.md');

let cvCache: string | null = null;
let apiKey: string | null = null;

const loadCv = (): string => {
  if (cvCache === null) {
    cvCache = readFileSync(CV_PATH, 'utf8');
  }
  return cvCache;
};

const initApiKey = (): void => {
  if (apiKey !== null) {
    return;
  }
  const key = process.env['GROQ_API_KEY'];
  if (!key) {
    throw new Error('GROQ_API_KEY is not set');
  }
  apiKey = key;
  console.info('[scorer] model=%s', MODEL);
};

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

CRITICAL: This candidate is a Frontend/React engineer ONLY.
If the job is primarily DevOps, Backend, Mobile, Data, QA, or any non-frontend role,
score it 0-20 regardless of any React/JS mentions in the description.
The job title must indicate a Frontend, React, UI, or Full-stack web position.

Scoring scale:
- 80-100: Excellent fit - core frontend skills present, EU/global remote, timezone OK
- 65-79: Good fit - most frontend skills match, minor gaps acceptable
- 0-64: Poor fit - wrong role type, major skill gaps, location blockers, or hard constraints

timezone_fit values:
- "good": EU or global remote, UTC+2 compatible, no strict overlap requirement
- "ok": global remote with loose overlap that candidate can adapt to, or unspecified
- "bad": US timezone required, PST/EST 9-5 mandatory, or overlap with US business hours required

Known gaps - NEVER score these as matched skills:
GraphQL, Angular, Vue, Svelte, Node.js backend production experience,
AWS beyond Essentials certification, Cypress/Playwright E2E testing.
If the job requires any of these, list them in missing_keywords.`;

const buildSystemPrompt = (): string => {
  return SYSTEM_PROMPT + '\n\nCandidate CV:\n' + loadCv();
};

const buildUserMessage = (job: PipelineJob): string => {
  return `Job: ${job.role} at ${job.company}
Source: ${job.source}
Location policy: ${job.locationPolicy ?? 'not specified'}
Salary: ${job.salaryInfo ?? 'not disclosed'}

Description (first ${MAX_DESC_CHARS} chars):
${job.description.slice(0, MAX_DESC_CHARS)}`;
};

const parseRetryAfterMs = (body: string): number => {
  const match = /try again in ([\d.]+)s/i.exec(body);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 20000;
};

const callApi = async (job: PipelineJob): Promise<string> => {
  if (apiKey === null) {
    throw new Error('apiKey not initialised');
  }
  const payload = JSON.stringify({
    model: MODEL,
    messages: [
      { content: buildSystemPrompt(), role: 'system' },
      { content: buildUserMessage(job), role: 'user' },
    ],
    max_tokens: 512,
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: payload,
    });

    if (resp.status === 429) {
      const body = await resp.text();
      const waitMs = parseRetryAfterMs(body);
      console.info(
        '[scorer] rate-limited, waiting %ds…',
        Math.ceil(waitMs / 1000)
      );
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`${resp.status} ${body}`);
    }

    const GroqResponseSchema = z.object({
      choices: z.array(
        z.object({ message: z.object({ content: z.string() }) })
      ),
    });
    const data = GroqResponseSchema.parse(await resp.json());
    return data.choices[0]?.message.content ?? '';
  }

  throw new Error('exceeded retry limit');
};

export const scoreJob = async (
  job: PipelineJob
): Promise<ScoreResult | null> => {
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
};

export const scoreBatch = async (
  jobs: PipelineJob[]
): Promise<(ScoreResult | null)[]> => {
  if (!jobs.length) {
    return [];
  }

  loadCv();

  const results: (ScoreResult | null)[] = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    for (const job of batch) {
      results.push(await scoreJob(job));
    }
    console.info(
      '[scorer] %d/%d scored',
      Math.min(i + BATCH_SIZE, jobs.length),
      jobs.length
    );
  }

  return results;
};
