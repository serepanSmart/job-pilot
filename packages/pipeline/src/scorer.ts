import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { PipelineJob, ScoreResult } from './types';

const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 5;
const MAX_DESC_CHARS = 3000;

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CV_PATH = path.resolve(DIR, '../../../data/cv-master.md');

let cvCache: string | null = null;
let clientCache: Anthropic | null = null;

function loadCv(): string {
  if (cvCache === null) {
    cvCache = readFileSync(CV_PATH, 'utf8');
  }
  return cvCache;
}

function getClient(): Anthropic {
  if (clientCache === null) {
    const token = process.env['JOBPILOT_CODEMIE_TOKEN'];
    if (!token) {
      throw new Error(
        'JOBPILOT_CODEMIE_TOKEN is not set. ' +
          'Inside a jobpilot session: set JOBPILOT_CODEMIE_TOKEN=proxy-handled in .env'
      );
    }
    const baseURL =
      process.env['CODEMIE_BASE_URL'] ??
      'https://codemie.lab.epam.com/code-assistant-api';
    clientCache = new Anthropic({ apiKey: token, baseURL });
  }
  return clientCache;
}

const RawScoreSchema = z.object({
  matched_keywords: z.array(z.string()).default([]),
  missing_keywords: z.array(z.string()).default([]),
  one_line_verdict: z.string().default(''),
  red_flags: z.array(z.string()).default([]),
  score: z.number().int().min(0).max(100),
  timezone_fit: z.enum(['bad', 'good', 'ok']).default('ok'),
});

const SYSTEM_PREFIX = `You score job postings against a candidate CV to determine fit.
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
If the job requires any of these, list them in missing_keywords.

Candidate CV:
`;

function buildSystemPrompt(): string {
  return SYSTEM_PREFIX + loadCv();
}

function buildUserMessage(job: PipelineJob): string {
  return `Job: ${job.role} at ${job.company}
Source: ${job.source}
Location policy: ${job.locationPolicy ?? 'not specified'}
Salary: ${job.salaryInfo ?? 'not disclosed'}

Description (first ${MAX_DESC_CHARS} chars):
${job.description.slice(0, MAX_DESC_CHARS)}`;
}

export async function scoreJob(job: PipelineJob): Promise<ScoreResult | null> {
  try {
    const response = await getClient().messages.create({
      max_tokens: 512,
      messages: [{ content: buildUserMessage(job), role: 'user' }],
      model: MODEL,
      system: buildSystemPrompt(),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const cleaned = text
      .replace(/^```json\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    const raw = RawScoreSchema.parse(JSON.parse(cleaned));

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
