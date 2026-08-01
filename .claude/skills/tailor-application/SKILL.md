---
name: tailor-application
description: Generate tailored CV (.docx) + cover letter + form answers for a job; status → tailored
trigger: /tailor-application
---

# /tailor-application

Generate a complete tailored application for a job in the dashboard.

## Input

Invoked as `/tailor-application <job_id>` — if no ID is given, list the top 5
`new` or `shortlisted` jobs by score and ask the user to pick one.

---

## Step 1 — Load data

**1a. Fetch the job:**
```bash
NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
import './packages/pipeline/src/env.ts';
import { getDb, jobs } from './packages/db/src/index.ts';
import { eq } from 'drizzle-orm';
const db = getDb();
const [row] = await db.select().from(jobs).where(eq(jobs.id, 'JOB_ID'));
console.log(JSON.stringify(row, null, 2));
EOF
```

**1b. Read the master CV and preferences:**
- `data/cv-master.md`
- `data/preferences.md`

---

## Step 2 — Analyse the JD

Read the job description carefully. Determine:

1. **Emphasis preset** (pick the best fit from cv-master.md Tailoring Notes):
   - `ai-focus` — JD mentions AI, LLM, Anthropic, MCP, AI dashboards
   - `lead-focus` — JD mentions lead/senior+leadership, team management, mentoring
   - `performance-focus` — JD mentions performance, optimization, Core Web Vitals
   - `architecture-focus` — JD mentions micro-frontends, monorepo, design systems
   - `nextjs-focus` — JD mentions Next.js prominently

2. **Keyword aliases** — use the JD's exact spelling (React.js / ReactJS / React; TypeScript / TS; TanStack Query / React Query; Front-end / Frontend / front end).

3. **Known gaps** — note anything the JD requires that is NOT in the CV:
   GraphQL, Angular, Vue, Svelte, Node.js backend, AWS beyond Essentials, Cypress/Playwright.
   These go into application notes only — never claim them in the CV.

---

## Step 3 — Generate tailored CV JSON

Produce a JSON object matching this exact shape (all fields required):

```json
{
  "name": "Serhii Vovna",
  "targetTitle": "<role title from the JD — use JD's spelling>",
  "location": "Vinnytsia, Ukraine (EET/EEST, UTC+2/+3)",
  "workMode": "Remote | B2B/Contract",
  "email": "serepanvovna@gmail.com",
  "phone": "+380 63 495 3048",
  "linkedin": "https://linkedin.com/in/serhii-vovna-211288191",
  "github": "https://github.com/serepanSmart",
  "portfolio": "https://portfolio-swtwo.vercel.app",
  "summary": "<tailored 3-4 sentence summary — lead with emphasis preset, mirror JD keywords>",
  "technologies": {
    "Languages": "TypeScript, JavaScript (ES6+), HTML5, CSS3",
    "Frontend": "<reorder to put JD-matched tech first>",
    "AI & LLM": "Anthropic Claude API, MCP, Agent Skills, AI Subagents, LLM Integration",
    "UI & Design Systems": "<keep relevant, drop irrelevant>",
    "Testing": "Vitest, Jest, React Testing Library, TDD",
    "Build & Tooling": "Vite, Webpack, Monorepo (Lerna), NPM/Yarn, Git, CI/CD",
    "Architecture": "Micro-frontends, Monorepos, Design Patterns, SOLID/DRY/KISS/YAGNI",
    "Performance": "Core Web Vitals, Bundle Optimization, Code-Splitting, Lazy Loading",
    "API": "REST"
  },
  "coreCompetencies": ["<8-10 competencies, lead with emphasis-preset ones>"],
  "experience": [
    {
      "company": "EPAM Systems",
      "companyLocation": "Ukraine (remote)",
      "companyPeriod": "Aug 2021 - Present",
      "roles": [
        {
          "title": "Lead Frontend Developer",
          "period": "Apr 2023 - Present",
          "bullets": ["<reorder bullets to lead with emphasis preset; max 5 bullets; mirror JD keywords; never invent>"],
          "tech": "React, TypeScript, <keep JD-relevant tech from cv-master>"
        },
        {
          "title": "Frontend Team Lead",
          "period": "Jan 2023 - Apr 2023",
          "bullets": ["<max 3 bullets>"],
          "tech": "React, Redux Toolkit, React Query, TypeScript, ..."
        },
        {
          "title": "Frontend Developer",
          "period": "Aug 2021 - Dec 2022",
          "bullets": ["<max 3 bullets>"],
          "tech": "JavaScript (Core), HTML, SCSS, Grunt, JSP/GWT"
        }
      ]
    },
    {
      "company": "Audienzz (via SMART-UI)",
      "companyLocation": "Ukraine (remote)",
      "companyPeriod": "Sep 2020 - Aug 2021",
      "roles": [
        {
          "title": "Frontend Engineer",
          "period": "Sep 2020 - Aug 2021",
          "bullets": ["<max 3 bullets — include if JD values Next.js, monorepo, design systems>"],
          "tech": "Next.js, React, TypeScript, Styled Components, Storybook, Lerna"
        }
      ]
    },
    {
      "company": "iCIMS (via SMART-UI)",
      "companyLocation": "Ukraine (remote)",
      "companyPeriod": "Oct 2019 - Aug 2020",
      "roles": [
        {
          "title": "Frontend Engineer",
          "period": "Oct 2019 - Aug 2020",
          "bullets": ["<2 bullets — include only if role values MPA, enterprise apps, build optimization>"],
          "tech": "JavaScript, HTML5, SCSS, Webpack"
        }
      ]
    }
  ],
  "education": [
    {
      "degree": "Master of Computer Science",
      "institution": "Kharkiv National Automobile and Highway University",
      "period": "2023"
    }
  ],
  "certifications": ["<pick the 5-8 most relevant to the JD from cv-master.md — prioritize Anthropic certs if ai-focus, skip Mambu/HubSpot/Contentstack unless relevant>"],
  "languages": [
    { "language": "English", "level": "Upper-Intermediate (B2+)" },
    { "language": "Ukrainian", "level": "Native" }
  ]
}
```

**Hard rules:**
- Never invent metrics, employers, dates, or technologies not in `data/cv-master.md`.
- Never claim GraphQL, Angular, Vue, Svelte, Node.js backend production, AWS beyond Essentials, Cypress/Playwright.
- Bullets may be rephrased and reordered; content must trace back to the master CV.

---

## Step 4 — Write output files

Determine the output directory:
```
output/applications/<company-slug>-<role-slug>/
```
Where slugs are lowercase, hyphen-separated (e.g. `linear-senior-frontend-engineer`).

**4a. Save the JSON:**
Write the tailored CV JSON to `output/applications/<slug>/cv-tailored.json`.

**4b. Generate the .docx:**
```bash
NODE_OPTIONS=--use-system-ca tsx packages/pipeline/src/docx-gen.ts \
  output/applications/<slug>/cv-tailored.json \
  output/applications/<slug>/cv-tailored.docx
```

**4c. Write the cover letter** to `output/applications/<slug>/cover-letter.md`:

Rules:
- 3 paragraphs, ≤250 words total.
- Paragraph 1: why this company/role specifically (use what is in the JD — product, mission, tech stack).
- Paragraph 2: strongest 2-3 relevant achievements from the CV (real metrics only).
- Paragraph 3: availability, timezone overlap (EET UTC+2/+3, flexible US hours overlap), invite to interview.
- Sign: "Serhii Vovna | serepanvovna@gmail.com"
- Never mention salary in a cover letter.

**4d. Write form answers** to `output/applications/<slug>/form-answers.md`:

```markdown
# Form Answers — <Company> — <Role>

**Salary expectation (annual):** 68,000 USD
**Salary expectation (hourly):** 33 USD/hour
**Notice period:** 2 weeks
**Earliest start date:** 1–2 weeks from offer acceptance
**Location:** Vinnytsia, Ukraine (remote)
**Authorized to work in <country>:** No — available as freelancer/contractor invoicing from Ukraine
**Willing to relocate:** Yes (form answer only — role is remote)
**Employment model:** B2B / contractor
**Portfolio:** portfolio-swtwo.vercel.app
**How did you hear about us:** <jobs.source value>
**Pronouns:** (leave blank)

## Known gaps for this application
<list any JD requirements absent from the CV>

## Application notes
<anything the user should know before submitting>
```

---

## Step 5 — Update job status

```bash
NODE_OPTIONS=--use-system-ca node --import tsx/esm - <<'EOF'
import './packages/pipeline/src/env.ts';
import { getDb, jobs } from './packages/db/src/index.ts';
import { eq } from 'drizzle-orm';
const db = getDb();
await db.update(jobs).set({ status: 'tailored' }).where(eq(jobs.id, 'JOB_ID'));
console.log('status → tailored');
EOF
```

---

## Step 6 — Report to user

Print a summary:
```
✓ output/applications/<slug>/cv-tailored.docx   — submit to ATS
✓ output/applications/<slug>/cover-letter.md    — paste or attach
✓ output/applications/<slug>/form-answers.md    — form field answers
  Status updated → tailored

PDF: open cv-tailored.docx in Pages/Word → File → Export as PDF
Known gaps: <list or "none">
```
