import { describe, expect, it } from 'vitest';
import type { PipelineJob } from '../types';
import {
  hardFilter,
  passesAgeFilter,
  passesLevelFilter,
  passesLocationFilter,
  passesTitleFilter,
} from '../filter';

const baseJob: PipelineJob = {
  company: 'Acme',
  description: 'Build React components',
  locationPolicy: 'remote',
  postedAt: new Date(),
  role: 'Senior Frontend Engineer',
  salaryInfo: null,
  source: 'remotive',
  url: 'https://example.com/job/1',
};

describe('passesTitleFilter', () => {
  it('accepts frontend roles', () => {
    expect(passesTitleFilter(baseJob)).toBe(true);
  });

  it('accepts role with react in title', () => {
    expect(passesTitleFilter({ ...baseJob, role: 'React Developer' })).toBe(
      true
    );
  });

  it('accepts when title is generic but description mentions react', () => {
    expect(
      passesTitleFilter({
        ...baseJob,
        role: 'Software Engineer',
        description: 'You will work with React and TypeScript',
      })
    ).toBe(true);
  });

  it('rejects react native roles', () => {
    expect(
      passesTitleFilter({ ...baseJob, role: 'React Native Developer' })
    ).toBe(false);
  });

  it('rejects unrelated roles without react in description', () => {
    expect(
      passesTitleFilter({
        ...baseJob,
        role: 'Data Scientist',
        description: 'Python and ML',
      })
    ).toBe(false);
  });
});

describe('passesLocationFilter', () => {
  it('accepts remote jobs', () => {
    expect(passesLocationFilter(baseJob)).toBe(true);
  });

  it('rejects hybrid jobs', () => {
    expect(
      passesLocationFilter({
        ...baseJob,
        description: 'This is a hybrid position',
      })
    ).toBe(false);
  });

  it('rejects US-only jobs', () => {
    expect(
      passesLocationFilter({
        ...baseJob,
        description: 'Must be located in the US',
      })
    ).toBe(false);
  });

  it('rejects Ukrainian office jobs', () => {
    expect(
      passesLocationFilter({
        ...baseJob,
        description: 'Робота в офісі, Київ',
      })
    ).toBe(false);
  });
});

describe('passesAgeFilter', () => {
  it('accepts jobs without posted date', () => {
    expect(passesAgeFilter({ ...baseJob, postedAt: null })).toBe(true);
  });

  it('accepts recent jobs', () => {
    expect(passesAgeFilter(baseJob)).toBe(true);
  });

  it('rejects jobs older than 21 days', () => {
    const old = new Date();
    old.setDate(old.getDate() - 22);
    expect(passesAgeFilter({ ...baseJob, postedAt: old })).toBe(false);
  });
});

describe('passesLevelFilter', () => {
  it('accepts senior roles', () => {
    expect(passesLevelFilter(baseJob)).toBe(true);
  });

  it('rejects junior roles', () => {
    expect(
      passesLevelFilter({ ...baseJob, role: 'Junior Frontend Developer' })
    ).toBe(false);
  });

  it('rejects internships', () => {
    expect(passesLevelFilter({ ...baseJob, role: 'Frontend Intern' })).toBe(
      false
    );
  });
});

describe('hardFilter', () => {
  it('accepts a well-matching job', () => {
    expect(hardFilter(baseJob)).toBe(true);
  });

  it('rejects a job that fails any filter', () => {
    expect(
      hardFilter({ ...baseJob, role: 'Junior React Native Developer' })
    ).toBe(false);
  });
});
