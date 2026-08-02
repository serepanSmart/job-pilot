import type { PipelineJob } from './types';

const TITLE_RE =
  /frontend|front-end|front end|\breact\b|ui engineer|web engineer|fullstack|full-stack|full stack/i;

const GENERIC_TITLE_RE =
  /software engineer|software developer|ai[\s-]*(native[\s-]*)?engineer|ai[\s-]*(native[\s-]*)?developer/i;

const FRONTEND_IN_DESC_RE =
  /\breact\b|\bfrontend\b|\bfront-end\b|\bfront end\b/i;

const REJECT_MOBILE_RE = /\breact native\b/i;

const REJECT_LOCATION_RE =
  /\bhybrid\b|on-site|onsite|\bus only\b|must be located in|us work authorization|\bw-2\b|\bw2\b|relocation required|\brelocation\b/i;

const REJECT_DOU_RE = /офіс|офісна|в офіс/i;

const JUNIOR_RE =
  /\bjunior\b|\bjr\.?\b|\bintern(ship)?\b|entry[\s-]level|graduate program/i;

const MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000;

export const passesTitleFilter = (job: PipelineJob): boolean => {
  if (REJECT_MOBILE_RE.test(job.role)) {
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
