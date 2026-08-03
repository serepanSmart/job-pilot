import './load-env';
import { getDb } from './client';
import { companies } from './schema';
import type { NewCompany } from './schema';

const COMPANIES: NewCompany[] = [
  // Greenhouse — original
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
  // Greenhouse — expanded batch 2
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'shopify' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'zendesk' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'twilio' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'confluent' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'cockroachlabs' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'dbtlabs' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'airbyte' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'fullstory' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'asana' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'framer' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'mural' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'xero' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'monzo' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'rippling' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'hibob' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'canva' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'coda' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'shortcut' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'heap' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'grafanalabs' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'temporal' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'superhuman' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'segment' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'clickhouse' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'productboard' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'pipedrive' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'calendly' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'paddle' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'postman' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'docker' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'mozilla' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'okta' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'fastly' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'pagerduty' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'zoom' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'cloudinary' },
  { addedFrom: 'seed', ats: 'greenhouse', slug: 'vimeo' },
  // Lever — original
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
  // Lever — expanded batch 2
  { addedFrom: 'seed', ats: 'lever', slug: 'close' },
  { addedFrom: 'seed', ats: 'lever', slug: 'hotjar' },
  { addedFrom: 'seed', ats: 'lever', slug: 'front' },
  { addedFrom: 'seed', ats: 'lever', slug: 'helpscout' },
  { addedFrom: 'seed', ats: 'lever', slug: 'maze' },
  { addedFrom: 'seed', ats: 'lever', slug: 'lokalise' },
  { addedFrom: 'seed', ats: 'lever', slug: 'appcues' },
  { addedFrom: 'seed', ats: 'lever', slug: 'dovetail' },
  // Ashby — original
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
  // Ashby — expanded batch 2
  { addedFrom: 'seed', ats: 'ashby', slug: 'workos' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'dub' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'turso' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'xata' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'payload' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'hygraph' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'stytch' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'cursor' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'warp' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'langchain' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'unkey' },
  { addedFrom: 'seed', ats: 'ashby', slug: 'tinybird' },
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
