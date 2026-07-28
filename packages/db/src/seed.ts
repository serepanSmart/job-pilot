/**
 * Seeds ~15 fake-but-plausible jobs across every status so the whole dashboard
 * can be built and triaged before the discovery pipeline exists (Phase 1).
 *
 * Run: npm run db:seed --workspace @jobpilot/db
 *
 * Destructive: clears jobs, seen_hashes, and companies first.
 */

import './load-env';
import { createHash } from 'node:crypto';
import { getDb } from './client';
import { companies, jobs, seenHashes } from './schema';
import type { NewCompany, NewJob } from './schema';

/** Same rule the pipeline will use: sha256 of normalized company + title. */
function contentHash(company: string, role: string): string {
  const normalized = `${company}::${role}`.toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex');
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  return daysAgo(-days);
}

type SeedJob = Omit<NewJob, 'contentHash'> & { company: string; role: string };

const seedJobs: SeedJob[] = [
  // ---- status: new (the Inbox) ----
  {
    company: 'Linear',
    role: 'Senior Frontend Engineer',
    url: 'https://jobs.example.com/linear/senior-frontend-engineer',
    source: 'greenhouse:linear',
    description:
      'We are looking for a Senior Frontend Engineer to work on our React ' +
      'and TypeScript application. You will own complex UI surfaces, care ' +
      'deeply about performance and Core Web Vitals, and help shape our ' +
      'design system. Fully remote within Europe. We use React 19, ' +
      'TypeScript, and a monorepo setup.',
    score: 92,
    verdict: 'Excellent React/TS match, EU-remote, design-system ownership.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'Core Web Vitals',
      'design system',
      'monorepo',
      'performance',
    ],
    missingKeywords: ['GraphQL'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€75,000 – €95,000',
    locationPolicy: 'Remote (Europe)',
    status: 'new',
    dateFound: daysAgo(1),
  },
  {
    company: 'Vercel',
    role: 'Lead Frontend Engineer, Dashboard',
    url: 'https://jobs.example.com/vercel/lead-frontend-dashboard',
    source: 'greenhouse:vercel',
    description:
      'Lead a small team building the Vercel dashboard. Next.js, React, ' +
      'TypeScript. You will drive technical direction, mentor engineers, and ' +
      'set frontend standards. Remote-friendly with EU/US overlap.',
    score: 89,
    verdict: 'Lead role on Next.js — matches leadership and Next.js history.',
    matchedKeywords: [
      'Next.js',
      'React',
      'TypeScript',
      'mentoring',
      'technical direction',
      'team lead',
    ],
    missingKeywords: ['Rust'],
    redFlags: ['Requires 4 hours of US overlap'],
    timezoneFit: 'ok',
    salaryInfo: '$120,000 – $160,000',
    locationPolicy: 'Remote (EU/US overlap)',
    status: 'new',
    dateFound: daysAgo(2),
  },
  {
    company: 'Hygraph',
    role: 'Frontend Engineer (React/TypeScript)',
    url: 'https://jobs.example.com/hygraph/frontend-engineer',
    source: 'remotive',
    description:
      'Join our frontend team building a headless CMS interface. React, ' +
      'TypeScript, and GraphQL. Remote within EU timezones. Experience with ' +
      'component libraries and Storybook is a plus.',
    score: 74,
    verdict: 'Good React/TS fit; GraphQL is central and is a real gap.',
    matchedKeywords: ['React', 'TypeScript', 'Storybook', 'component library'],
    missingKeywords: ['GraphQL', 'Apollo Client'],
    redFlags: ['GraphQL listed as a core requirement'],
    timezoneFit: 'good',
    salaryInfo: '€65,000 – €80,000',
    locationPolicy: 'Remote (EU)',
    status: 'new',
    dateFound: daysAgo(3),
  },
  {
    company: 'Ashby',
    role: 'Senior Product Engineer (Frontend)',
    url: 'https://jobs.example.com/ashby/senior-product-engineer',
    source: 'ashby:ashby',
    description:
      'Build the recruiting product used by fast-growing companies. Heavy ' +
      'React and TypeScript, complex data tables, and performance work. ' +
      'Remote, Europe or Americas.',
    score: 81,
    verdict: 'Strong React/TS + performance; recruiting domain matches iCIMS.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'performance',
      'recruiting software',
    ],
    missingKeywords: ['GraphQL', 'Node.js'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: 'Not disclosed',
    locationPolicy: 'Remote (Europe/Americas)',
    status: 'new',
    dateFound: daysAgo(4),
  },
  {
    company: 'Doist',
    role: 'Senior Frontend Engineer',
    url: 'https://jobs.example.com/doist/senior-frontend-engineer',
    source: 'weworkremotely',
    description:
      'Fully async, fully remote team behind Todoist and Twist. React, ' +
      'TypeScript, and a strong design culture. We work asynchronously ' +
      'across timezones with no mandatory overlap.',
    score: 86,
    verdict: 'Async-first remote, no overlap demand — ideal timezone fit.',
    matchedKeywords: ['React', 'TypeScript', 'async', 'remote-first'],
    missingKeywords: ['React Native'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '$90,000 – $115,000',
    locationPolicy: 'Remote (worldwide)',
    status: 'new',
    dateFound: daysAgo(5),
  },

  // ---- status: shortlisted ----
  {
    company: 'Pitch',
    role: 'Lead Frontend Engineer',
    url: 'https://jobs.example.com/pitch/lead-frontend-engineer',
    source: 'lever:pitch',
    description:
      'Own the frontend architecture of a collaborative presentation tool. ' +
      'React, TypeScript, real-time collaboration. Remote in Europe.',
    score: 88,
    verdict: 'Architecture ownership + lead scope, EU remote.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'frontend architecture',
      'team lead',
      'micro-frontends',
    ],
    missingKeywords: ['WebRTC', 'CRDT'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€85,000 – €105,000',
    locationPolicy: 'Remote (Europe)',
    status: 'shortlisted',
    dateFound: daysAgo(7),
    notes: 'Real-time collab is new to me but architecture scope is a fit.',
  },
  {
    company: 'Contentful',
    role: 'Senior Frontend Engineer, Web App',
    url: 'https://jobs.example.com/contentful/senior-frontend-web-app',
    source: 'greenhouse:contentful',
    description:
      'Work on the Contentful web app. React, TypeScript, and a large ' +
      'design system. Berlin-based but remote within EU is fine.',
    score: 84,
    verdict:
      'CMS domain matches Contentstack/HubSpot certs; big design system.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'design system',
      'CMS',
      'Storybook',
    ],
    missingKeywords: ['GraphQL'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€80,000 – €95,000',
    locationPolicy: 'Remote (EU)',
    status: 'shortlisted',
    dateFound: daysAgo(8),
  },

  // ---- status: tailored ----
  {
    company: 'Sanity',
    role: 'Senior Frontend Engineer (AI Features)',
    url: 'https://jobs.example.com/sanity/senior-frontend-ai',
    source: 'greenhouse:sanity',
    description:
      'Build AI-assisted content editing features. React, TypeScript, and ' +
      'direct LLM API integration. Remote in Europe.',
    score: 95,
    verdict: 'Best match so far: AI/LLM integration is my differentiator.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'LLM integration',
      'Anthropic Claude',
      'AI features',
      'MCP',
    ],
    missingKeywords: ['Python'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€90,000 – €110,000',
    locationPolicy: 'Remote (Europe)',
    status: 'tailored',
    dateFound: daysAgo(10),
    notes: 'Used ai-focus preset. CV + cover letter ready in output/.',
  },

  // ---- status: applied ----
  {
    company: 'Raycast',
    role: 'Senior Frontend Engineer',
    url: 'https://jobs.example.com/raycast/senior-frontend-engineer',
    source: 'remoteok',
    description:
      'React and TypeScript, extension ecosystem, very high UI quality bar. ' +
      'Remote in Europe.',
    score: 87,
    verdict: 'High UI-quality bar, EU remote, strong React/TS match.',
    matchedKeywords: ['React', 'TypeScript', 'UI quality', 'performance'],
    missingKeywords: ['Swift', 'macOS'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€85,000 – €100,000',
    locationPolicy: 'Remote (Europe)',
    status: 'applied',
    dateFound: daysAgo(14),
    dateApplied: daysAgo(9),
    followUpDue: daysAgo(2),
    notes: 'Applied via their form. No response yet — follow-up is due.',
  },
  {
    company: 'Tines',
    role: 'Lead Frontend Engineer',
    url: 'https://jobs.example.com/tines/lead-frontend-engineer',
    source: 'lever:tines',
    description:
      'Lead frontend for a security automation platform. React, TypeScript, ' +
      'complex workflow builder UI. Remote EU.',
    score: 83,
    verdict: 'Lead scope, complex builder UI, EU remote.',
    matchedKeywords: ['React', 'TypeScript', 'team lead', 'complex UI'],
    missingKeywords: ['Ruby', 'security domain'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€90,000 – €115,000',
    locationPolicy: 'Remote (EU)',
    status: 'applied',
    dateFound: daysAgo(12),
    dateApplied: daysAgo(4),
    followUpDue: daysFromNow(3),
  },

  // ---- status: screening ----
  {
    company: 'Storyblok',
    role: 'Senior Frontend Engineer',
    url: 'https://jobs.example.com/storyblok/senior-frontend-engineer',
    source: 'arbeitnow',
    description:
      'Headless CMS, Vue-heavy stack but migrating parts to React. ' +
      'TypeScript throughout. Fully remote in Europe.',
    score: 71,
    verdict: 'CMS fit and EU remote, but the existing stack is Vue.',
    matchedKeywords: ['TypeScript', 'CMS', 'React'],
    missingKeywords: ['Vue', 'Nuxt'],
    redFlags: ['Primary stack is Vue, which I have not used professionally'],
    timezoneFit: 'good',
    salaryInfo: '€70,000 – €85,000',
    locationPolicy: 'Remote (Europe)',
    status: 'screening',
    dateFound: daysAgo(20),
    dateApplied: daysAgo(15),
    notes: 'Recruiter call done. They know Vue is a gap; open to ramp-up.',
  },

  // ---- status: interview ----
  {
    company: 'Supabase',
    role: 'Senior Frontend Engineer, Studio',
    url: 'https://jobs.example.com/supabase/senior-frontend-studio',
    source: 'greenhouse:supabase',
    description:
      'Build the Supabase Studio dashboard. React, TypeScript, Next.js. ' +
      'Fully remote, async-first.',
    score: 90,
    verdict: 'Next.js dashboard work, async remote — very strong fit.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'Next.js',
      'dashboard',
      'async',
      'monorepo',
    ],
    missingKeywords: ['PostgreSQL internals'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '$110,000 – $140,000',
    locationPolicy: 'Remote (worldwide)',
    status: 'interview',
    dateFound: daysAgo(25),
    dateApplied: daysAgo(21),
    notes: 'Tech interview scheduled. Prep: dashboard perf, monorepo setup.',
  },

  // ---- status: offer ----
  {
    company: 'Framer',
    role: 'Senior Frontend Engineer',
    url: 'https://jobs.example.com/framer/senior-frontend-engineer',
    source: 'remotive',
    description:
      'Work on the Framer editor. Deep React, TypeScript, and rendering ' +
      'performance. Remote in Europe.',
    score: 91,
    verdict: 'Rendering performance focus matches the 40% load-time work.',
    matchedKeywords: [
      'React',
      'TypeScript',
      'rendering performance',
      'Core Web Vitals',
    ],
    missingKeywords: ['WebGL'],
    redFlags: [],
    timezoneFit: 'good',
    salaryInfo: '€95,000 – €115,000',
    locationPolicy: 'Remote (Europe)',
    status: 'offer',
    dateFound: daysAgo(35),
    dateApplied: daysAgo(30),
    notes: 'Offer at €102k. Deciding — compare against Supabase outcome.',
  },

  // ---- status: rejected ----
  {
    company: 'Stripe',
    role: 'Frontend Engineer, Dashboard',
    url: 'https://jobs.example.com/stripe/frontend-engineer-dashboard',
    source: 'greenhouse:stripe',
    description:
      'Frontend engineering on the Stripe Dashboard. React and TypeScript. ' +
      'Remote within specific EU countries only.',
    score: 78,
    verdict: 'Strong tech fit but their remote list excludes Ukraine.',
    matchedKeywords: ['React', 'TypeScript', 'dashboard'],
    missingKeywords: ['Ruby'],
    redFlags: ['Remote allowed only from a fixed list of EU countries'],
    timezoneFit: 'ok',
    salaryInfo: 'Not disclosed',
    locationPolicy: 'Remote (selected EU countries)',
    status: 'rejected',
    dateFound: daysAgo(40),
    dateApplied: daysAgo(36),
    notes: 'Rejected at CV stage — contractor from Ukraine not supported.',
  },

  // ---- status: archived ----
  {
    company: 'Bolt',
    role: 'Frontend Engineer (Hybrid, Tallinn)',
    url: 'https://jobs.example.com/bolt/frontend-engineer-tallinn',
    source: 'arbeitnow',
    description:
      'Frontend engineer for our Tallinn office. React and TypeScript. ' +
      'Hybrid: three days per week on site.',
    score: 66,
    verdict: 'Hybrid on-site in Tallinn — fails the remote-only requirement.',
    matchedKeywords: ['React', 'TypeScript'],
    missingKeywords: [],
    redFlags: ['Hybrid, three days on site', 'Relocation to Tallinn expected'],
    timezoneFit: 'good',
    salaryInfo: '€60,000 – €75,000',
    locationPolicy: 'Hybrid (Tallinn)',
    status: 'archived',
    dateFound: daysAgo(11),
    notes: 'Archived: on-site requirement. Hard filter should have caught it.',
  },
];

const seedCompanies: NewCompany[] = [
  { slug: 'linear', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'vercel', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'contentful', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'sanity', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'supabase', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'stripe', ats: 'greenhouse', addedFrom: 'seed' },
  { slug: 'pitch', ats: 'lever', addedFrom: 'seed' },
  { slug: 'tines', ats: 'lever', addedFrom: 'seed' },
  { slug: 'ashby', ats: 'ashby', addedFrom: 'remotive' },
];

async function seed(): Promise<void> {
  const db = getDb();

  console.info('[seed] clearing existing rows...');
  await db.delete(jobs);
  await db.delete(seenHashes);
  await db.delete(companies);

  const rows: NewJob[] = seedJobs.map((job) => ({
    ...job,
    contentHash: contentHash(job.company, job.role),
  }));

  await db.insert(jobs).values(rows);
  await db.insert(companies).values(seedCompanies);

  // Every seeded job is "seen", plus two hashes for jobs that scored too low
  // to be inserted — mirroring what the real pipeline records.
  await db
    .insert(seenHashes)
    .values([
      ...rows.map((row) => ({ hash: row.contentHash })),
      { hash: contentHash('SomeAgency', 'Junior React Developer') },
      { hash: contentHash('OnsiteCorp', 'Frontend Developer (on-site)') },
    ]);

  const byStatus = new Map<string, number>();
  for (const row of rows) {
    byStatus.set(
      row.status ?? 'new',
      (byStatus.get(row.status ?? 'new') ?? 0) + 1
    );
  }

  console.info('[seed] inserted %d jobs:', rows.length);
  for (const [status, count] of byStatus) {
    console.info('  %s: %d', status.padEnd(12), count);
  }
  console.info(
    '[seed] %d companies, %d seen hashes',
    seedCompanies.length,
    rows.length + 2
  );
}

await seed();
