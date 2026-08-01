import { z } from 'zod';

export const PipelineJobSchema = z.object({
  company: z.string().min(1),
  description: z.string().default(''),
  locationPolicy: z.string().nullable().default(null),
  postedAt: z.coerce.date().nullable().default(null),
  role: z.string().min(1),
  salaryInfo: z.string().nullable().default(null),
  source: z.string(),
  url: z.string().url(),
});

export type PipelineJob = z.infer<typeof PipelineJobSchema>;

export const ScoreResultSchema = z.object({
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  oneLineVerdict: z.string().max(120),
  redFlags: z.array(z.string()),
  score: z.number().int().min(0).max(100),
  timezoneFit: z.enum(['bad', 'good', 'ok']),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;
export type ScoredJob = PipelineJob & ScoreResult;
