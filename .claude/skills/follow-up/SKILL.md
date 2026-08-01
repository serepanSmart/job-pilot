---
name: follow-up
description: List applications 7+ days after applying with no response and draft polite follow-up emails
trigger: /follow-up
---

# /follow-up

List stale applications and draft follow-up emails.

## Steps

1. **Query stale applications** — status `applied`, `date_applied` older than 7 days, no `follow_up_due` in the future:
   ```bash
   NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
   import './packages/pipeline/src/env.ts';
   import { getDb, jobs } from './packages/db/src/index.ts';
   import { eq, lt, or, isNull, sql } from 'drizzle-orm';
   const db = getDb();
   const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
   const rows = await db.select({
     company: jobs.company, dateApplied: jobs.dateApplied,
     followUpDue: jobs.followUpDue, id: jobs.id,
     notes: jobs.notes, role: jobs.role, url: jobs.url,
   }).from(jobs)
     .where(sql`${jobs.status} = 'applied' AND ${jobs.dateApplied} < ${cutoff} AND (${jobs.followUpDue} IS NULL OR ${jobs.followUpDue} < NOW())`);
   console.log(JSON.stringify(rows, null, 2));
   EOF
   ```

2. **Show the list.** For each job print: company, role, days since applied, url.
   If none, tell the user there are no stale applications.

3. **Draft follow-up emails.** For each stale job, write a polite follow-up email:

   Rules:
   - 3–4 sentences max. Professional, warm, not pushy.
   - Subject: `Following up — [Role] application at [Company]`
   - Reference the specific role applied for.
   - Ask whether they are still reviewing candidates and express continued interest.
   - Sign with Serhii's name and email (`serepanvovna@gmail.com`).
   - Do NOT fabricate interview dates or recruiter names — use only what is in `jobs.notes`.

4. **Set follow_up_due.** After the user picks which emails to send, update `follow_up_due` to 7 days from today:
   ```bash
   NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
   import './packages/pipeline/src/env.ts';
   import { getDb, jobs } from './packages/db/src/index.ts';
   import { eq, sql } from 'drizzle-orm';
   const db = getDb();
   const id = 'JOB_ID_HERE';
   await db.update(jobs).set({ followUpDue: sql`NOW() + INTERVAL '7 days'` }).where(eq(jobs.id, id));
   console.log('follow_up_due updated');
   EOF
   ```
