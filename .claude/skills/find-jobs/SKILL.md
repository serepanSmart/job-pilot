---
name: find-jobs
description: Run the full discovery pipeline and print funnel numbers per source
trigger: /find-jobs
---

# /find-jobs

Run the full discovery pipeline locally.

## Steps

1. From the repo root run:
   ```bash
   npm run pipeline
   ```
2. The pipeline prints a funnel table: `Source | Fetched | Filtered | New | Scored | Inserted`.
3. Report the totals to the user. Note any source returning 0 that normally returns data (WAF/proxy blocks on EPAM network are expected for HN Algolia).
4. If new jobs were inserted, remind the user to triage the Inbox at `http://localhost:3000`.
