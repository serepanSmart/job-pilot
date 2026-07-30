import { z } from 'zod';

export const PipelineJobSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  url: z.string().url(),
  source: z.string(),
  description: z.string().default(''),
  salaryInfo: z.string().nullable().default(null),
  locationPolicy: z.string().nullable().default(null),
  postedAt: z.coerce.date().nullable().default(null),
});

export type PipelineJob = z.infer<typeof PipelineJobSchema>;
