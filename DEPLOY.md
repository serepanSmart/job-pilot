# DEPLOY.md

Click-by-click setup, free tiers only. Target cost: **$0/month**.

Steps 1–3 are covered here (end of Phase 1). Steps 4–5 (GitHub Actions secrets,
Resend digest) arrive at the end of Phase 4.

---

## Step 1 — Private GitHub repo ✅ done

The repo already exists and `master` is pushed:

- **Repo:** https://github.com/serepanSmart/job-pilot
- **Visibility:** PRIVATE — this is mandatory. `data/cv-master.md` contains a
  phone number, email, and LinkedIn, and `data/preferences.md` contains salary
  expectations. Never flip this repo to public.

The remote uses an SSH host alias so pushes go out as `serepanSmart` regardless
of which GitHub account the `gh` CLI has active:

```bash
git remote -v
# origin  git@github.com-serepan:serepanSmart/job-pilot.git
```

That alias is defined in `~/.ssh/config`:

```
Host github.com-serepan
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_serepan
```

Commit identity is set per-repo, so work commits elsewhere keep the EPAM
address:

```bash
git config --local user.name  "Serhii Vovna"
git config --local user.email "serepanvovna@gmail.com"
```

Verify the SSH path any time with:

```bash
ssh -T git@github.com-serepan   # expect: Hi serepanSmart!
```

Routine pushes from now on:

```bash
git push
```

---

## Step 2 — Neon Postgres (free tier)

1. Go to **https://console.neon.tech** and sign in (GitHub login is fine).
2. **Create project**:
   - Name: `job-pilot`
   - Postgres version: default
   - Region: **AWS Europe (Frankfurt)** — must match the Vercel function
     region (`fra1`, pinned in `apps/web/vercel.json`). The database should sit
     next to the _compute_, not next to you: each page render makes several SQL
     round trips but only one browser round trip.
   - **A Neon project's region cannot be changed later** — moving means creating
     a new project and migrating. Everything else on that screen is editable.
   - Leave **Neon Auth** off. Auth is our own HMAC-signed cookie
     (`apps/web/src/lib/session.ts`); Neon Auth would add unused user/session
     tables.
3. On the project dashboard open **Connection string** and turn on the
   **Pooled connection** toggle. Copy the string; it looks like:

   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   Use the **pooled** (`-pooler`) host. Vercel's serverless functions open many
   short-lived connections, and the unpooled endpoint runs out of slots fast.

4. Create your local `.env` from the template and paste it in:

   ```bash
   cp .env.example .env
   ```

   Then set:

   ```
   DATABASE_URL=postgresql://...-pooler...neon.tech/neondb?sslmode=require
   DASHBOARD_PASSWORD=<pick a long passphrase, 8+ chars>
   ```

   `.env` is git-ignored — confirm with `git check-ignore .env`.

5. Apply the schema and load seed data:

   ```bash
   npm run db:migrate --workspace @jobpilot/db
   npm run db:seed    --workspace @jobpilot/db
   ```

   The seed prints a per-status breakdown and is **destructive** — it clears
   `jobs`, `seen_hashes`, and `companies` first. Safe to re-run.

6. Check it locally:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, sign in with `DASHBOARD_PASSWORD`, and triage.

   Optional data browser: `npm run db:studio --workspace @jobpilot/db`.

**Free-tier watch:** Neon's free plan covers 0.5 GB storage and one project.
Job descriptions are the bulk of the data; a few thousand rows stays far under
the limit. Neon also auto-suspends idle compute, so the first request after a
quiet period takes a second or two — that is expected, not a bug.

---

## Step 3 — Vercel (Hobby)

1. Go to **https://vercel.com/new** and sign in with GitHub.
2. **Import** `serepanSmart/job-pilot`. Grant repo access if prompted — Hobby
   deploys private repos fine. (The one Hobby restriction is repos owned by a
   GitHub _organization_; this one is owned by your personal account.)
3. Configure the project:
   - **Root Directory:** `apps/web`
   - Leave **Include files outside of the Root Directory** enabled — the build
     needs the workspace root for `packages/db` and the lockfile.
   - Framework preset: **Next.js** (auto-detected)
   - Build & install commands: leave the defaults. npm workspaces are detected
     from the root `package-lock.json`.
   - **Function region:** already pinned to Frankfurt (`fra1`) by
     `apps/web/vercel.json`, so there is nothing to click. Vercel's default for
     new projects is `iad1` (Washington, D.C.), which would put every SQL query
     across the Atlantic from the Frankfurt database. Confirm after the first
     deploy under **Settings → Functions → Function Regions**. Hobby allows a
     single region, which is all we need.
4. Add **Environment Variables** (Production, Preview, and Development).

   **Type these into the Vercel UI directly. Do not put production values in
   any file in this repo, including `.env`.** Anything written to the local
   `.env` shows up in the Claude Code transcript (the harness surfaces file
   diffs), so treat local values as compromised by default and keep production
   values separate.

   | Name                 | Value                                                 |
   | -------------------- | ----------------------------------------------------- |
   | `DATABASE_URL`       | pooled Neon string, with a **freshly reset** password |
   | `DASHBOARD_PASSWORD` | a **new** passphrase, different from the local one    |

   Recommended order:
   1. In Neon, **Roles → `neondb_owner` → Reset password**. This invalidates the
      password used during local development.
   2. Paste that new connection string into Vercel — and only into Vercel.
   3. Generate a fresh `DASHBOARD_PASSWORD` (a password manager is ideal, since
      the login field is `autocomplete="current-password"`) and enter it only in
      Vercel.
   4. Locally, keep whatever throwaway values you like in `.env`; the two
      environments do not need to match.

   No separate cookie secret exists: the session cookie is HMAC-signed with
   `DASHBOARD_PASSWORD`, so changing the password logs you out everywhere.

5. **Deploy**. When it finishes, open the URL, sign in, and confirm the Inbox
   shows the seeded jobs.

**Free-tier watch:** Hobby is for non-commercial use — a personal job-search
dashboard qualifies. Every page is `force-dynamic` (triage state must never be
cached), so each visit is a function invocation; at single-user traffic this is
nowhere near the 1M/month allowance.

---

## Steps 4–5 — coming in Phase 4

- GitHub Actions cron (`0 */6 * * *`) with secrets `DATABASE_URL`,
  `RESEND_API_KEY`, and `JOBPILOT_CODEMIE_TOKEN`. All LLM calls go through the
  EPAM CodeMie gateway — no personal Anthropic key is needed. The CI/CD
  credential strategy for the CodeMie token (which has a 24h SSO lifetime) will
  be decided in Phase 4.
- Resend digest email, sending from `onboarding@resend.dev` to your own address
  (no domain verification needed).

Private repos get 2,000 Actions minutes/month on the GitHub Free plan. The 6-hour
cron is ~120 runs/month, so even at 5 minutes per run that is ~600 minutes —
comfortably inside the allowance.

---

## LLM cost

All LLM calls (scoring + tailoring) go through the **EPAM CodeMie gateway**
(`https://codemie.lab.epam.com`) — billed to EPAM, not to a personal account.
The pipeline reads `JOBPILOT_CODEMIE_TOKEN` and the Anthropic SDK is pointed at
the CodeMie base URL. No personal Anthropic key is needed, and the work
Enterprise `ANTHROPIC_API_KEY` is never touched. See CLAUDE.md hard constraint #8.

Model reference (prices via CodeMie are EPAM-negotiated — treat these as the
direct-API ceiling):

| Model                | Input /1M | Output /1M |
| -------------------- | --------- | ---------- |
| Haiku 4.5 (scoring)  | $1.00     | $5.00      |
| Sonnet 4.6/5 (tailor)| $3.00     | $15.00     |

Rough volume: ~4,000 tokens per job (CV + prompt + posting), ~200 output. At 50
new jobs/day that is ~$7–8/month at list price — covered by EPAM quota in
practice.

Two levers if quota ever becomes a concern:

1. **Prompt caching.** The CV repeats in every request. ⚠️ Haiku 4.5's minimum
   cacheable prefix is 4,096 tokens; `data/cv-master.md` is ~2,500. If the
   prefix is under the minimum, caching silently does nothing — verify with
   `cache_creation_input_tokens` before relying on it.
2. **Halve the cron to every 12 hours.** Job boards move slowly; 12-hour polling
   catches nearly as much as 6-hour.

Target infra cost: **$0** for hosting, database, CI, and LLM (CodeMie quota).
