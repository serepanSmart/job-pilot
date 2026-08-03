import './load-env';
import { getDb } from './client';
import { companies } from './schema';
import type { NewCompany } from './schema';

const COMPANIES: NewCompany[] = [
  // Greenhouse
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'linear' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'vercel' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'contentful' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'sanity' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'supabase' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'stripe' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'figma' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'notion' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'loom' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'retool' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'posthog' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'sentry' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'snyk' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'miro' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'webflow' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'airtable' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'remote' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'deel' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'zapier' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'hubspot' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'atlassian' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'mongodb' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'elastic' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'cloudflare' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'intercom' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: '1password' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'hashicorp' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'lattice' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'descript' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'mercury' },
  // Greenhouse — EU / remote-first additions
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'algolia' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'datadog' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'amplitude' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'netlify' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'typeform' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'personio' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'mixpanel' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'wise' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'gitbook' },
  // Lever
  { addedFrom: 'seed', ats: 'lever', slug: 'pitch' },
  { addedFrom: 'seed', ats: 'lever', slug: 'tines' },
  { addedFrom: 'seed', ats: 'lever', slug: 'doist' },
  { addedFrom: 'seed', ats: 'lever', slug: 'storyblok' },
  { addedFrom: 'seed', ats: 'lever', slug: 'benchling' },
  { addedFrom: 'seed', ats: 'lever', slug: 'gem' },
  { addedFrom: 'seed', ats: 'lever', slug: 'sourcegraph' },
  { addedFrom: 'seed', ats: 'lever', slug: 'brex' },
  // Lever — EU / remote-first additions
  { addedFrom: 'seed', ats: 'lever', slug: 'grammarly' },
  { addedFrom: 'seed', ats: 'lever', slug: 'mattermost' },
  { addedFrom: 'seed', ats: 'lever', slug: 'klarna' },
  // Ashby
  { addedFrom: 'seed', ats: 'ashby', slug: 'ashby' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'raycast' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'cal' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'resend' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'loops' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'railway' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'render' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'highlight' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'trigger' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'inngest' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'graphite' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'liveblocks' },
  // Ashby — EU / remote-first additions
  { addedFrom: 'seed', ats: 'ashby', slug: 'clerk' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'neon' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'browsercompany' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'plain' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'basehub' },
];

async function seedCompanies(): Promise<void> {
  const db = getDb();

  await db.insert(companies).values(COMPANIES).onConflictDoNothing();

  const byAts = new Map<string, number>();
  for (const { ats } of COMPANIES) {
    byAts.set(ats, (byAts.get(ats) ?? 0) + 1);
  }

  console.info('[seed-companies] upserted %d companies:', COMPANIES.length);
  for (const [ats, count] of byAts) {
    console.info('  %s: %d', ats.padEnd(12), count);
  }
}

await seedCompanies();
