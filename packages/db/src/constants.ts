/**
 * Enum domains shared by the pipeline and the web app. Fixed by the spec —
 * see CLAUDE.md "DB schema".
 */

/** `jobs.status` domain. Order is the intended pipeline/kanban order. */
export const JOB_STATUSES = [
  'new',
  'shortlisted',
  'tailored',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'archived',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Columns shown on the /pipeline kanban, in order. */
export const PIPELINE_STATUSES = [
  'new',
  'shortlisted',
  'tailored',
  'applied',
  'screening',
  'interview',
  'offer',
] as const satisfies readonly JobStatus[];

/** Funnel stages for /stats, in order. */
export const FUNNEL_STAGES = [
  'applied',
  'screening',
  'interview',
  'offer',
] as const satisfies readonly JobStatus[];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  shortlisted: 'Shortlisted',
  tailored: 'Tailored',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
};

/** `companies.ats` domain — the three ATS boards with public posting APIs. */
export const ATS_PROVIDERS = ['greenhouse', 'lever', 'ashby'] as const;

export type AtsProvider = (typeof ATS_PROVIDERS)[number];

/** `jobs.timezone_fit` domain, as produced by the LLM scorer. */
export const TIMEZONE_FITS = ['good', 'ok', 'bad'] as const;

export type TimezoneFit = (typeof TIMEZONE_FITS)[number];

/** Minimum LLM score required to reach the Inbox; below this → seen_hashes. */
export const SCORE_THRESHOLD = 65;

/** Score at or above which the UI turns success-green. */
export const SCORE_STRONG = 80;

/** Days after applying with no response before `follow-up` surfaces a job. */
export const FOLLOW_UP_AFTER_DAYS = 7;
