import type { PipelineJob } from './types';

const TITLE_RE = /frontend|front-end|front end|\breact\b|next\.?js\b|nextjs\b/i;

const REJECT_FULLSTACK_RE = /\bfull[\s-]?stack\b/i;

const GENERIC_TITLE_RE =
  /software engineer|software developer|web engineer|ui engineer|ai[\s-]*(native[\s-]*)?engineer|ai[\s-]*(native[\s-]*)?developer|\btypescript\b|vue\.?js|vuejs|nuxt\.?js|nuxtjs|\bsvelte\b|\bangular\b/i;

const FRONTEND_IN_DESC_RE =
  /\breact\b|\bfrontend\b|\bfront-end\b|\bfront end\b|\bnext\.?js\b/i;

const REJECT_MOBILE_RE = /\breact native\b/i;

const REJECT_LOCATION_RE =
  /\bhybrid\b|on-site|onsite|\bus only\b|must be located in|us work authorization|\bw-2\b|\bw2\b|relocation required|requires relocation|relocation to\b|must relocate/i;

const REJECT_DOU_RE = /офіс|офісна|в офіс/i;

const REJECT_DOU_ENGLISH_RE =
  /\boffice\b|\b(kyiv|kharkiv|lviv|dnipro|odesa|odessa)\b/i;

const JUNIOR_RE =
  /\bjunior\b|\bjr\.?\b|\bintern(ship)?\b|entry[\s-]level|graduate program/i;

const MAX_AGE_MS = 35 * 24 * 60 * 60 * 1000;

export const passesTitleFilter = (job: PipelineJob): boolean => {
  if (REJECT_MOBILE_RE.test(job.role)) {
    return false;
  }
  if (REJECT_FULLSTACK_RE.test(job.role)) {
    return false;
  }
  if (TITLE_RE.test(job.role)) {
    return true;
  }
  if (GENERIC_TITLE_RE.test(job.role)) {
    return FRONTEND_IN_DESC_RE.test(job.description);
  }
  return false;
};

export const passesLocationFilter = (job: PipelineJob): boolean => {
  const text = `${job.role} ${job.description} ${job.locationPolicy ?? ''}`;
  if (REJECT_LOCATION_RE.test(text)) {
    return false;
  }
  if (REJECT_DOU_RE.test(text)) {
    return false;
  }
  if (job.source === 'dou' && REJECT_DOU_ENGLISH_RE.test(text)) {
    return false;
  }
  return true;
};

export const passesAgeFilter = (job: PipelineJob): boolean => {
  if (job.postedAt === null) {
    return true;
  }
  return Date.now() - job.postedAt.getTime() <= MAX_AGE_MS;
};

export const passesLevelFilter = (job: PipelineJob): boolean => {
  return !JUNIOR_RE.test(job.role);
};

export const hardFilter = (job: PipelineJob): boolean => {
  return (
    passesTitleFilter(job) &&
    passesLocationFilter(job) &&
    passesAgeFilter(job) &&
    passesLevelFilter(job)
  );
};
