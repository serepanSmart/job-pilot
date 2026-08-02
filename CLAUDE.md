# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Phase 5 complete.** All phases 0–5 are done. DB, full UI, auth, discovery pipeline, LLM scoring, digest email, GitHub Actions cron, and the application factory skills are in place.

This file is the operative spec and **supersedes `PROMPT.md`**, which is kept
only as the origin document. Where the two disagree, this file wins — notably
the framework versions, which were deliberately moved off `PROMPT.md`'s pins
(see [Repo layout & stack](#repo-layout--stack)).

`data/preferences.md` is filled in as of 2026-07-28 — nothing is outstanding
from Phase 0.

## What JobPilot is

An autonomous job discovery & application agent for Serhii — Senior/Lead
Frontend Engineer (React, TypeScript, 7+ yrs, AI/LLM integration), based in
Ukraine (EET/EEST, UTC+2/+3), seeking **remote-only** senior/lead roles,
preferably EU/US companies.

Three deliverables:

1. **Dashboard** (Next.js + Material UI, custom premium dark theme) to triage and
   track applications.
2. **Automated pipeline** (GitHub Actions cron) that discovers jobs from legal
   APIs/RSS, scores them against the master CV, and fills the dashboard.
3. **Claude Code skills** that tailor ATS-friendly applications per job.

Operating principle: **the user never searches for jobs manually — they only
triage the Inbox.**

## Hard constraints (never violate)

1. **No scraping or automating LinkedIn, Indeed, Djinni, Wellfound, or
   Jobgether** (ToS risk). Their email alerts arriving in Gmail may be parsed in
   a later phase; the sites themselves are off limits.
2. **Never invent facts** for the CV or cover letters — only rephrase and
   re-prioritize content from the master CV. Respect its "known gaps" section.
   **Fabrication is a critical bug.**
3. **Auto-submission only for email applications.** For web forms, prepare
   everything and let the user submit manually.
4. Only the official/public APIs and RSS feeds listed under [Job
   sources](#job-sources).
5. Tailored CVs must be **ATS-friendly**: single column, standard headings
   (Experience, Skills, Education), no tables/graphics/icons, `.docx` +
   text-extractable PDF.
6. This repo is **PRIVATE** (personal data). Never commit `.env`; `.gitignore`
   must cover `.env*`, `output/`, `node_modules`, `data/state`.
7. **Treat the local `.env` as visible in the session.** The harness surfaces
   diffs of modified files, so a secret written there lands in the transcript
   whether Claude or the user typed it — writing it "quietly" does not work.
   Consequences:
   - The local `.env` holds **development-only** values. If they leak, nothing
     of value is lost.
   - **Production secrets are typed straight into the Vercel dashboard and
     GitHub Actions secrets, never into a file** in this repo. They must differ
     from the local ones.
   - Never echo a secret into chat either. If a real credential does reach the
     transcript, say so plainly and rotate it.
8. **Never use a direct Anthropic credential for pipeline LLM calls.** The dev
   machine has a work **Enterprise** `ANTHROPIC_API_KEY` exported in the shell;
   a zero-arg Anthropic SDK client or any ambient-key read would bill Unity
   silently. Pipeline scoring uses **Groq** (`GROQ_API_KEY`, model
   `llama-3.1-8b-instant`) — a free-tier external provider with no token
   rotation burden. Tailoring skills still use `JOBPILOT_CODEMIE_TOKEN` via
   CodeMie gateway. No `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, or
   `CLAUDE_CODE_OAUTH_TOKEN` in the pipeline — see [LLM
   access](#llm-access--read-before-touching-scoring-or-tailoring).

## Repo layout & stack

Monorepo via **npm workspaces + turborepo**:

| Path | Contents |
|---|---|
| `apps/web` | Next.js 16 (App Router) + Material UI v9 (`@mui/material-nextjs`, Emotion) |
| `packages/pipeline` | Discovery/scoring (Node + TS, `tsx` runner) |
| `packages/db` | Drizzle ORM schema + client (shared) |
| `data/` | `cv-master.md`, `preferences.md`, local state |
| `output/` | Generated applications (git-ignored) |

**Versions are deliberate, not incidental.** `PROMPT.md` pinned Next 15 + MUI v6;
those were 2 and 3 majors behind by the time Phase 0 ran, so the project moved to
current latest. Installed: **Next 16.2.12, React 19.2.8, MUI 9.2.0,
`@mui/material-nextjs` 9.1.1, TypeScript 6.0.3, ESLint 10, turbo 2.10.7**.
TypeScript is capped below 6.1 because `typescript-eslint` 8.x requires
`typescript >=4.8.4 <6.1.0` — do not bump TS past 6.0.x without checking that.

- **DB:** Neon serverless Postgres (free tier) — `DATABASE_URL`
- **Hosting:** Vercel free/hobby tier (`apps/web`, root directory `apps/web`)
- **Scheduling:** GitHub Actions cron `0 */6 * * *` (`packages/pipeline`)
- **Digest email:** Resend free tier — `RESEND_API_KEY`
- **Target monthly infra cost: $0.** Flag anything that could exceed free tiers
  (Neon storage, Actions minutes, CodeMie usage quota) in `DEPLOY.md`.

## LLM access — read before touching scoring or tailoring

Two providers, split by task:

| Task | Provider | Model | Credential |
|---|---|---|---|
| **Scoring** (pipeline) | Groq (free tier) | `llama-3.1-8b-instant` | `GROQ_API_KEY` |
| **Tailoring** (skills) | EPAM CodeMie gateway | Sonnet-class | `JOBPILOT_CODEMIE_TOKEN` |

### Scoring: Groq

The pipeline scorer (`packages/pipeline/src/scorer.ts`) calls the Groq
OpenAI-compatible API directly. `GROQ_API_KEY` is a free-tier key with no
expiration burden — stable for CI. It must **never** fall back to Anthropic
SDK or read `ANTHROPIC_API_KEY`.

### Tailoring: CodeMie gateway

The `/tailor-application` skill uses the EPAM CodeMie gateway (Anthropic SDK
with custom `baseURL`). `JOBPILOT_CODEMIE_TOKEN` is the SSO bearer token from
`codemie profile status` — rotate daily (expires ~24h) during local use.

### Hard rule (both paths)

Never construct a zero-arg `new Anthropic()` or read `ANTHROPIC_API_KEY`,
`ANTHROPIC_AUTH_TOKEN`, or `CLAUDE_CODE_OAUTH_TOKEN`. The dev machine exports
a work Enterprise key; using it silently bills Unity.

### Interactive sessions: launch with `jobpilot`, never plain `claude`

Decided 2026-07-29. Sessions for this repo run through the EPAM CodeMie gateway
in an isolated `CLAUDE_CONFIG_DIR` (`~/.claude-jobpilot`), so the Unity
Enterprise seat is neither billed nor sent telemetry. The launcher is the
executable script `~/.local/bin/jobpilot`; plain `claude`, the VS Code panel, and bare
`codemie-claude` all leak to Unity in one way or another.

**Full rationale, verification steps, and failure modes: `RUNNING.md`.** Read it
before changing anything about how sessions are started.

## Commands

All verified working as of Phase 0. Run from the repo root.

```bash
npm run dev            # turbo run dev — apps/web dev server
npm run build          # turbo run build
npm run lint           # turbo run lint (eslint per workspace)
npm run lint:fix       # eslint . --fix across the repo
npm run typecheck      # turbo run typecheck (tsc --noEmit per workspace)
npm run format         # prettier --write .
npm run format:check   # prettier --check .
npm run pipeline       # run the discovery pipeline (tsx, @jobpilot/pipeline)
```

Single workspace: `npm run <script> --workspace @jobpilot/web` (also
`@jobpilot/db`, `@jobpilot/pipeline`).

**Verification gate for every phase: `lint` + `typecheck` + `build` must pass.**

Not yet set up — add in the phase that first needs them:

- **Migrations:** `drizzle-kit` is not installed. Phase 1 adds it to
  `packages/db` along with `drizzle.config.ts`.
- **Tests:** no runner installed. Code standards call for Vitest; the
  single-test form will be `npx vitest run <file> -t '<name>'` once it exists.

### Monorepo gotchas (learned the hard way in Phase 0)

- **`types: ["node"]` is set explicitly** in every workspace `tsconfig.json`.
  Automatic `@types` discovery does *not* reach the hoisted root
  `node_modules/@types` from a nested workspace, so `console`/`process` fail to
  resolve without it.
- **No `baseUrl`.** Deprecated in TS 6 (error `TS5101`). `paths` resolves
  relative to the tsconfig file instead.
- **Root `package.json` needs `packageManager`.** turbo 2.10+ refuses to resolve
  the workspace without it.
- **`turbopack.root` is pinned** in `apps/web/next.config.ts`. Otherwise Next
  walks up past the repo and latches onto an unrelated lockfile in the user's
  home directory.
- **`@jobpilot/db` is consumed as TS source** (`exports: "./src/index.ts"`, no
  build step), which is why `apps/web` sets `transpilePackages: ['@jobpilot/db']`.
- **MUI v9 removed Stack's system props.** `<Stack alignItems justifyContent>`
  no longer typechecks — only `direction`, `spacing`, `divider`, `useFlexGap`,
  `sx`, `children` are valid. Put flexbox alignment in `sx`.
- **MUI v9 removed compound style-override classes.** `containedPrimary`,
  `outlinedSuccess` and friends are gone; use the `variants` array with
  `props` matchers instead (see `apps/web/src/theme/theme.ts`).
- **Never mirror server props into state with an effect.** The react-hooks rule
  `set-state-in-effect` fails the build. Optimistic triage uses
  `useOptimistic` + `useTransition`, which rebases automatically when
  `revalidatePath` lands. See `apps/web/src/components/inbox.tsx`.
- **`middleware.ts` must live in `src/`**, next to `app/` — i.e.
  `apps/web/src/middleware.ts`. At the package root it is silently ignored: the
  build still prints `ƒ Proxy (Middleware)`, but every protected route renders
  without an auth check. Verified by curl: unauthenticated requests must return
  `307` to `/login`.
- **Editing `.env` requires a dev-server restart.** Next's own `.env`
  hot-reloading does not apply, because the root `.env` is loaded once at boot
  by `process.loadEnvFile` in `next.config.ts`.
- **Next only reads `.env` from its own project directory.** This monorepo keeps
  one `.env` at the root (shared with the pipeline), so
  `apps/web/next.config.ts` calls `process.loadEnvFile` on it explicitly. On
  Vercel the variables come from project settings and no `.env` exists.
- **Server components cannot pass `component={Link}` to a MUI component** —
  "Functions cannot be passed directly to Client Components". `next/link` is
  wired in once via `MuiButtonBase.defaultProps.LinkComponent` in the theme, so
  clickable MUI elements just set `href`. Rendering `<Link>` directly in a
  server component is fine; only passing it as a prop is not.
- **Top-level `await` in a scratch script needs `"type": "module"` nearby.** A
  `.ts` file in `/tmp` gets transformed as CJS and fails; put throwaway scripts
  inside `packages/db/src/`.
- **Deleting a page leaves stale `.next/types`.** If typecheck complains about
  a module that no longer exists, `rm -rf apps/web/.next`.
- **`npm audit` reports 3 high-severity advisories** (`postcss` 8.4.31, `sharp`
  0.34.5), both transitive from Next. Next pins `postcss` to an exact version and
  `sharp` is an optional dep, so they are left alone deliberately: neither is
  reachable in this app (build-time CSS and image optimization; the pipeline
  never feeds them untrusted input). Do not "fix" these with overrides without
  re-testing the build.

## Code standards

Mirror `github.com/serepanSmart/portfolio-sw`.

### Types & exports

- No `any` / `as any`, no non-null `!`, no `as unknown as X`. Use type guards
  or explicit checks; plain `as SomeType` only when the target type is provably
  correct and narrowing is not practical.
- `interface` for object shapes; `type` only for unions, intersections, and
  inferred aliases (`type Foo = z.infer<typeof FooSchema>`).
- No TypeScript `enum` or `const enum`. Use an `as const` array + union type +
  `Record` for display labels:

  ```ts
  export const JOB_STATUSES = ['new', 'shortlisted' /* … */] as const;
  export type JobStatus = (typeof JOB_STATUSES)[number];
  export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
    new: 'New',
    shortlisted: 'Shortlisted',
  };
  ```

  Canonical example: `packages/db/src/constants.ts`. Enforced by
  `no-restricted-syntax` on `TSEnumDeclaration`.

  **`pgEnum` and `z.enum` are not TypeScript enums** — never "fix" them. They
  are derived from the `as const` arrays, which is the intended pattern.

- `import type { … }` for type-only imports. (Enforced by
  `@typescript-eslint/consistent-type-imports`; `verbatimModuleSyntax` catches
  the remainder at the compiler level.)
- Named exports only; **no default exports except Next.js route files**.
- Interface and param-object fields **alphabetical**; optional fields last, also
  alphabetical: `{ aField: string; bField: string; aOpt?: number }`.

### Style

- `===` / `!==` only. Null+undefined: `value === null || value === undefined`,
  **never** `value == null`.
- **Braces around every `if`/`else`/`for`/`while` body.** (Enforced by `curly`.)
- No nested ternaries. (Enforced by `no-nested-ternary`.)
- Array emptiness: `!!array.length` / `!array.length` — never `.length > 0` /
  `.length === 0`.
- Destructure at the call site.
- **No comments by default, not even short "why" ones.** Only when genuinely
  unreadable without it: inline, one line max. Never block or JSDoc comments in
  application code.
- Hyphen `-`, never em dash, in source strings and prose.

### React

- `ComponentName.displayName = 'ComponentName';` on the line after every
  component definition, including after `memo(…)` / `forwardRef(…)`.

### Tooling

- **TS strict:** `strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`,
  `noUncheckedSideEffectImports`; `target` ES2022; `moduleResolution` bundler.
- **No `any`.** Use `unknown` + **zod parsing at every IO boundary**: job board
  responses, LLM output, route handler bodies, env vars.
- **ESLint** flat config: typescript-eslint (strict + stylistic), react-hooks,
  `eslint-config-prettier` last. Extra rules: `eqeqeq`, `curly`, `no-nested-ternary`,
  `@typescript-eslint/consistent-type-imports`.
- **Prettier:** `semi: true`, `trailingComma: "es5"`, `singleQuote: true`,
  `printWidth: 80`, `tabWidth: 2`, `arrowParens: "always"`, `endOfLine: "lf"`.
- **Husky pre-commit + lint-staged:** `eslint --fix`, `prettier`, `tsc --noEmit`.
- Path alias `@/`; kebab-case file names; functional components with typed props.
- Verification gate for every phase: `lint` + `typecheck` + `build` must pass.

### Git & PRs

- PRs always `gh pr create --draft` unless told otherwise.
- Integrate `master` with `git merge`, never `git rebase`.
- Never commit or push unprompted. When asked to commit - just do it. When not
  asked - show the planned message + files to stage and wait for a go-ahead.

## Design system — "Obsidian Violet"

Premium dark, black-purple. **Dark is the DEFAULT.**

MUI v9 API: build the theme with `createTheme({ cssVariables: true, colorSchemes:
{ dark: true, ... } })` and wrap the app in `ThemeProvider defaultMode="dark"`.
`PROMPT.md`'s `extendTheme`/`CssVarsProvider` was the v6 spelling — v7 merged
`CssVarsProvider` into `ThemeProvider` and removed `extendTheme`. The palette and
token *values* below are unaffected by that change.

The App Router integration is `AppRouterCacheProvider` from
**`@mui/material-nextjs/v16-appRouter`** (already wired in
`apps/web/src/app/layout.tsx`).

### Palette

- `background.default` `#0B0910` (near-black purple-tinted, never pure `#000`)
- `background.paper` `#141020`; elevated/hover surfaces `#1C1729`
- `primary`: main `#8B5CF6`, light `#A78BFA`, dark `#6D28D9`, contrastText `#FFF`
- Accent gradient (logo, score ring, contained buttons **only**):
  `linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)`
- `text`: primary `#EDEAF6`, secondary `#9B94B3`, disabled `#5A5470`
- `success` `#34D399` (score ≥ 80, offer) · `warning` `#FBBF24` (score 65–79, red
  flags) · `error` `#FB7185` (rejected) · `info` `#60A5FA`
  (screening/interview)
- `divider` `rgba(139,92,246,0.12)`

### Look & feel rules

Two rules are the ones most likely to be broken — hold the line on both:

- **No default MUI elevation shadows.** Cards/Paper are flat `#141020` with a
  `1px solid rgba(139,92,246,0.12)` border and `borderRadius: 12`.
- **All of this lives in theme `styleOverrides`** (`MuiCard`, `MuiChip`,
  `MuiButton`, `MuiAlert`, `MuiAppBar`) — do **not** sprinkle `sx` overrides
  across pages.

The rest:

- Interactive card hover: border `rgba(139,92,246,0.35)` + box-shadow
  `0 0 24px rgba(124,58,237,0.15)`, transition `150ms ease`.
- AppBar: glassmorphism — `rgba(11,9,16,0.7)` + `backdrop-filter: blur(12px)`,
  1px bottom divider, gradient logo text "JobPilot".
- Score badge: circular gradient ring with the number inside; ring turns
  success-green at 80+.
- Chips outlined with translucent fill `rgba(139,92,246,0.08)`; matched keywords
  green-outlined, missing gray, source/meta neutral.
- Alerts: translucent bg (e.g. `rgba(251,191,36,0.08)`) + matching 1px border —
  never solid fills.
- `focus-visible`: 2px outline `#A78BFA` (keyboard triage must stay visible).
- Typography: **Sora** 600 for headings (`letterSpacing: -0.01em`), **Inter** for
  body — both self-hosted via `next/font`.
- Thin scrollbars, thumb `rgba(139,92,246,0.25)`. Comfortable density: 20–24px
  card padding, 12px gaps.

## DB schema (Drizzle, Postgres)

**`jobs`** — `id` uuid pk, `company`, `role`, `url` unique, `source`,
`description` text, `score` int, `verdict`, `matched_keywords` jsonb,
`missing_keywords` jsonb, `red_flags` jsonb, `timezone_fit`, `salary_info`,
`location_policy`, `status` enum, `date_found`, `date_applied`, `follow_up_due`
timestamps, `notes` text, `content_hash` unique, `created_at`, `updated_at`.

`status` enum: `new | shortlisted | tailored | applied | screening | interview |
offer | rejected | archived`

**`seen_hashes`** — `hash` pk, `first_seen`. Invariant: **archived jobs never
resurface** — that is what this table is for.

**`companies`** — `slug` pk, `ats` enum (`greenhouse | lever | ashby`),
`added_from`.

## Dashboard pages (`apps/web`)

1. **`/` Inbox** — `status = new`, sorted score desc. Card shows company, role,
   gradient score ring, one-line verdict, chips (source, location policy, age).
   Actions: Shortlist / Archive / Open JD. Keyboard: `j`/`k` navigate, `s`
   shortlist, `x` archive. Snackbar with Undo on archive.
2. **`/pipeline`** — kanban by status, drag-and-drop (`@dnd-kit`), column counts.
3. **`/job/[id]`** — full JD, score breakdown (matched = green chips, missing =
   gray, red flags = warning Alerts), notes editor, status select, links to
   tailored application files.
4. **`/stats`** — funnel found → applied → screening → interview → offer +
   weekly applications bar chart (recharts, themed to the palette).

- **Data layer:** server components + server actions, optimistic UI on triage.
- **Auth:** single-user. `/login` sets a signed httpOnly cookie, checked in
  middleware against `DASHBOARD_PASSWORD`. **No NextAuth.**
- Responsive down to mobile — the user triages from their phone.

## Job sources

| Source | Access |
|---|---|
| Remotive | `https://remotive.com/api/remote-jobs?category=software-dev` |
| RemoteOK | `https://remoteok.com/api` |
| Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` |
| WeWorkRemotely | RSS, programming category |
| HN Who is Hiring | `https://hn.algolia.com/api/v1/` — locate the latest monthly thread, parse comments for REMOTE + frontend/react |
| DOU | RSS, Front End category (`jobs.dou.ua/vacancies/feeds/` — **verify exact URL/params at build time**); expect many office/hybrid postings, hard filters must catch them |
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true` |
| Lever | `https://api.lever.co/v0/postings/{company}?mode=json` |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/{company}` |

- ATS boards are driven by the `companies` table. Seed with ~50 companies known
  to hire remote frontend engineers from Europe — **propose the list, the user
  reviews it.**
- **Auto-grow:** when any aggregator job links to a greenhouse/lever/ashby board,
  extract the company slug and insert it into `companies`.
- **Not direct sources** (email-alert phase later): Djinni, LinkedIn, Wellfound,
  Jobgether.

## Pipeline stages (`packages/pipeline`)

1. **Fetch** all sources in parallel → normalize to one zod-validated `Job` type:
   `{ company, role, url, source, description, salary_info, location_policy,
   posted_at }`.
2. **Dedupe:** `content_hash = sha256(normalized company + title)`; fuzzy title
   match for near-duplicates; skip anything present in `seen_hashes`.
3. **Hard filters** (code, no LLM):
   - Reject if title lacks `frontend | front-end | react | ui engineer | web
     engineer | fullstack` (+ `react` in description).
   - Reject if text contains `hybrid | on-site | onsite | US only | must be
     located in | US work authorization | W2 | relocation required` — for DOU
     also office-bound wording and `офіс`.
   - Reject junior/intern; reject older than **21 days**.
   - **When unsure — KEEP.** False negatives are worse than false positives.
4. **LLM scoring** (via `LlmScorer` → CodeMie gateway, batched) against
   `data/cv-master.md` → strict JSON:
   ```json
   { "score": 0, "matched_keywords": [], "missing_keywords": [],
     "red_flags": [], "timezone_fit": "good|ok|bad", "one_line_verdict": "" }
   ```
   `score >= 65` → insert with status `new`; below → `seen_hashes` only.
5. **Digest:** if new jobs were inserted, email the user via Resend — top matches
   with scores, verdicts, and dashboard links.

## Skills (`.claude/skills/`)

All four skills are implemented in `.claude/skills/`. Invoke each with its trigger:

1. **`/find-jobs`** (`.claude/skills/find-jobs/SKILL.md`) — run the full pipeline
   locally, print funnel numbers (fetched → deduped → filtered → scored → inserted).
2. **`/score-job`** (`.claude/skills/score-job/SKILL.md`) — score a single pasted
   URL/JD (e.g. from a Djinni/Wellfound/LinkedIn alert email) and insert into the DB.
3. **`/tailor-application`** (`.claude/skills/tailor-application/SKILL.md`) — given
   a job id: tailored CV (`.docx`) + cover letter + standard form answers (salary,
   notice period, work auth, timezone), saved to
   `output/applications/{company}-{role}/`, status → `tailored`. Uses the emphasis
   presets and "known gaps" from the master CV. ATS rules from Hard Constraints apply.
4. **`/follow-up`** (`.claude/skills/follow-up/SKILL.md`) — list applications 7+
   days after applying with no response, draft polite follow-up emails.

When the user types any of these triggers, invoke the Skill tool with the matching
skill name before doing anything else.

## CV handling rules

**Source of truth: `data/cv-master.md`.** Moved there in Phase 0; no copy remains
at the repo root.

`data/preferences.md` is **filled in** (2026-07-28). Read it before answering any
application-form question. Three rules when using it:

- Entries reading "No preference" / "None" are **deliberate** — the user chose not
  to constrain them. Do not treat them as unanswered and do not invent
  constraints to fill the gap.
- **Salary: name the target rate, 31–34 USD/h, not the 25 USD/h floor.** The
  floor exists only as a walk-away threshold. Annual equivalent: 65–70k gross.
- Two fields still route back to the user: **visa sponsorship** ("possibly,
  depends on the role") and **pronouns** (optional — leave blank, never guess).

`Willing to relocate: yes` in that file is an **answer for application forms
only**. It does not loosen the remote-only hard filters — the user confirmed the
pipeline stays remote-only.

Tailoring contract — **rephrase, reorder, and re-prioritize only.** Never invent
metrics, employers, dates, or technologies. When a JD asks for something absent
from the CV, omit it or record it in `missing_keywords`.

- **Emphasis presets** (pick per JD, reorder bullets accordingly): `ai-focus`,
  `lead-focus`, `performance-focus`, `architecture-focus`, `nextjs-focus`.
- **Keyword aliases** — use the JD's exact spelling: React.js/ReactJS ↔ React;
  Front-end/Front End ↔ Frontend; TS ↔ TypeScript; a11y ↔ Accessibility;
  TanStack Query ↔ React Query.
- **Known gaps — never claim these:** GraphQL, Angular, Vue, Svelte, Node.js
  backend production experience, AWS beyond the Essentials cert,
  Cypress/Playwright E2E. If a JD requires one, cite the closest real experience
  instead and flag the gap in the application notes.

## Git & deploy

- `git init` in Phase 0. **Conventional commits.** Default branch: `master`.
  Commit at the end of every phase — **after the user's approval**.
- `.github/workflows/pipeline.yml`: cron `0 */6 * * *` + `workflow_dispatch`;
  steps checkout → setup-node 22 + npm cache → `npm ci` → run pipeline →
  digest. Secrets: `DATABASE_URL`, `RESEND_API_KEY`, and `JOBPILOT_CODEMIE_TOKEN`
  (see hard constraint #8). **CI/CD credential strategy for the CodeMie token
  is decided in Phase 4** — SSO tokens expire in 24h; a service account token
  or alternative must be confirmed with EPAM before the workflow is wired up.
- Produce/update **`DEPLOY.md`** at the end of Phase 1 and Phase 4 — exact
  click-by-click, copy-paste instructions assuming free tiers:
  1. create PRIVATE GitHub repo + push (exact git commands),
  2. Neon: create project, pooled connection string, run migrations,
  3. Vercel: import repo, root directory `apps/web`, env vars (`DATABASE_URL`,
     `DASHBOARD_PASSWORD`), deploy,
  4. Obtain a long-lived `JOBPILOT_CODEMIE_TOKEN` (Phase 4 decision) and store
     as GitHub secret, plus `DATABASE_URL` and `RESEND_API_KEY`,
  5. Resend: domain-less onboarding (send from `onboarding@resend.dev` to the
     user's own address), API key.

## Build order — STOP after each phase and wait for review

**Current position: Phase 0 done — Phase 1 next.**

- **Phase 0 — Skeleton. ✅ Done.** Turborepo + npm workspaces, all configs
  (tsconfig, eslint flat, prettier, husky + lint-staged), folder structure, this
  file, `.env.example`, `.gitignore`, git repo on `master`, `cv-master.md` moved
  to `data/`, `data/preferences.md` template created. lint + typecheck + build
  verified green. `data/preferences.md` filled in by the user.
- **Phase 1 — DB + full UI on seed data.** Drizzle schema + migrations + seed
  script (~15 realistic fake jobs across all statuses). All four pages + theme +
  auth against seed data. Deliver `DEPLOY.md` steps 1–3.
- **Phase 2 — Discovery (no LLM).** All fetchers + normalization + dedupe + hard
  filters + proposed companies seed list. Run once locally, show funnel numbers
  per source.
- **Phase 3 — Scoring.** `LlmScorer` via CodeMie gateway + DB inserts. Full
  pipeline end-to-end; tune the scoring prompt and threshold **with the user**
  before proceeding.
- **Phase 4 — Scheduling + digest.** GitHub Actions workflow + Resend digest.
  Deliver `DEPLOY.md` steps 4–5. Verify via manual `workflow_dispatch`.
- **Phase 5 — Application factory.** `tailor-application` + `follow-up` skills.
  Test on ONE real job from the Inbox; the user reviews CV/letter quality.
- **Phase 6 — Polish** (only after Phase 5 works). Stats refinements, mobile
  ergonomics, undo everywhere, empty states, loading skeletons.
