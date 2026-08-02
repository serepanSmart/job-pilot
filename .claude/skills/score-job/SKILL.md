---
name: score-job
description: Score a single job posting (URL or pasted JD) and insert it into the dashboard
trigger: /score-job
---

# /score-job

Score a single job pasted from a Djinni / LinkedIn / Wellfound / Jobgether alert email.

## Input

The user provides either:
- A URL to a job posting, OR
- The full job description text pasted directly

## Steps

1. **Get the JD text.**
   - If a URL was given, fetch its content:
     ```bash
     curl -sL "<url>" | sed 's/<[^>]*>//g' | head -300
     ```
   - If text was pasted, use it as-is.

2. **Extract fields.** Parse the text for: `company`, `role`, `url` (use the given URL or `manual:<slug>`), `source` (`manual`), `description`, `salary_info`, `location_policy`, `posted_at` (today's date as ISO string).

3. **Hard filter.** Apply the same rules as the pipeline:
   - Must contain `frontend | front-end | react | ui engineer | web engineer | fullstack` in title (or react in description).
   - Must NOT contain `hybrid | on-site | onsite | US only | must be located in | US work authorization | W2 | relocation required | React Native`.
   - Must NOT be junior/intern.
   - If it fails, tell the user why and stop.

4. **Score.** Run the scorer script inline:
   ```bash
   NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
   import './packages/pipeline/src/env.ts';
   import { scoreBatch } from './packages/pipeline/src/scorer.ts';
   const job = { company: 'COMPANY', role: 'ROLE', description: `DESCRIPTION`, source: 'manual', url: 'URL', salaryInfo: null, locationPolicy: null, postedAt: null };
   const [result] = await scoreBatch([job]);
   console.log(JSON.stringify(result, null, 2));
   EOF
   ```
   Fill in the actual values. `GROQ_API_KEY` must be set (see `.env`).

5. **Report score.** Show the user: score, verdict, matched keywords, missing keywords, red flags, timezone fit.

6. **Insert if score >= 65.**
   ```bash
   NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
   import './packages/pipeline/src/env.ts';
   import { insertScoredJobs } from './packages/pipeline/src/insert.ts';
   // paste the full scored job object here
   const rows = await insertScoredJobs([...]);
   console.log('Inserted:', rows.length);
   EOF
   ```

7. Remind the user the job is now in the Inbox at `http://localhost:3000`.
