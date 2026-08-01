# RUNNING.md — how to start a session, and who pays for it

Written 2026-07-29. Companion to `CLAUDE.md` (the spec) and `DEPLOY.md`
(hosting). This file answers exactly two questions: **what command starts a
session for this project**, and **which account gets billed**.

## TL;DR

```bash
cd ~/Documents/Job\ search
jobpilot
```

`jobpilot` is an executable script at `~/.local/bin/jobpilot` (outside git — it
holds no secrets, but it is machine-local). It is the *only* approved way to open
a Claude Code session for this repo.

**It is deliberately a script, not a shell function.** A function is captured
when `~/.zshrc` is sourced, so every already-open terminal keeps running whatever
version was current at that moment — and the earlier versions of this launcher
called plain `claude`, i.e. the Unity seat, with no visible sign beyond a missing
CodeMie banner. A script is re-read on every invocation. If `type -a jobpilot`
reports a function, that is a leftover: `unfunction jobpilot; hash -r`.

Arguments pass straight through: `jobpilot -c` (continue), `jobpilot -p "…"`
(print mode), `jobpilot --model …`.

After editing `~/.zshrc`, run `source ~/.zshrc` once; new terminals pick it up
automatically.

## Who pays

| Surface | Credential | Billed to | Telemetry |
|---|---|---|---|
| **`jobpilot`** ✅ | CodeMie SSO token → `https://codemie.lab.epam.com/code-assistant-api` | **EPAM** (AI/Run CodeMie) | none to Unity |
| plain `claude` ❌ | Unity OAuth seat (`serhii.vovna@unity3d.com`) | **Unity — forbidden here** | OTEL → Unity collector |
| Claude Code VS Code panel ❌ | same Unity OAuth seat | **Unity — forbidden here** | OTEL → Unity collector |
| bare `codemie-claude` ⚠️ | CodeMie token (billing fine) | EPAM | **OTEL still → Unity** (shares `~/.claude`) |
| pipeline (Phase 3+) | `JOBPILOT_CODEMIE_TOKEN` → CodeMie gateway | EPAM | none |

The rule this encodes: **Unity must neither see nor pay for this project.**
Hard constraint #8 in `CLAUDE.md` is the same rule for pipeline code.

Note the ⚠️ row: running `codemie-claude` by hand is *not* equivalent to
`jobpilot`. The wrapper does not set `CLAUDE_CONFIG_DIR`, so the session reads
`~/.claude/settings.json` — which is where the Unity OTEL exporter lives.

## What the launcher does, and why each line matters

Source of truth is `~/.local/bin/jobpilot`; in short it unsets the work
credentials and the Unity OTEL variables, checks the SSO token, exports
`CLAUDE_CONFIG_DIR`, `CODEMIE_CONV_SYNC_DISABLED=1`, `CODEMIE_METRICS_DISABLED=1`
and `DISABLE_AUTOUPDATER=1`, warns if an `oauthAccount` ever appears in the
isolated profile, then `exec codemie-claude "$@"`.

- **`unset ANTHROPIC_API_KEY`** — the Unity work key is exported from
  `~/.zshrc:2`. Credential precedence is `ANTHROPIC_API_KEY` →
  `ANTHROPIC_AUTH_TOKEN` → OAuth, first match wins, so the work key outranks
  the gateway token. `codemie-claude` does *not* delete it (it only does that
  in its `anthropic-subscription` provider branch), so the launcher must.
- **`unset` of the OTEL vars + `CLAUDE_CODE_ENABLE_TELEMETRY`** — belt and
  braces. The exporter config lives in `~/.claude/settings.json`, which this
  session never reads, but a parent shell can also have them exported.
- **SSO guard** — `codemie profile refresh` opens a browser, so it must run
  only when the token is actually dead (roughly once every 24h), not on every
  launch. A hard `exit 1` on failure prevents starting a session in an
  undefined auth state.
- **`CLAUDE_CONFIG_DIR`** — separate config root: own `settings.json`
  (no OTEL block, `CLAUDE_CODE_ENABLE_TELEMETRY: "0"`), own transcripts, own
  memory. Deliberately **no** `oauthAccount`, so a Unity charge is impossible
  even if auth breaks — the worst case is a login prompt.
- **`CODEMIE_CONV_SYNC_DISABLED=1`** — without it CodeMie uploads full
  conversation text (prompts *and* model responses) to its platform. Verified
  on 2026-07-29: an unflagged session produced
  `~/.codemie/sessions/completed_*_conversation.jsonl` with
  `status: success, response: {"syncedCount": 2}`; with the flag that file is
  not created at all. Checked in `syncProcessor.js:32`. **Remove this flag if
  EPAM policy requires conversation capture** — it is a deliberate opt-out.
- **`CODEMIE_METRICS_DISABLED=1`** — kept for intent, but **it does not work**
  in CLI 0.10.1. Verified: the per-session metrics record still uploads
  (`syncStatus: synced`) and still carries
  `userPrompts: [{count, text}]` — i.e. the literal text of every user prompt.
  The flag is only honoured in `session-config.js:19`, which is not the path the
  plugin hooks take. Do not rely on it. See "What EPAM can see" below.

## What EPAM can see (read this before pasting anything sensitive)

This setup isolates **Unity**, not EPAM. `https://codemie.lab.epam.com` is a
proxy in front of Anthropic: every request body — system prompt, file contents
the agent reads, the master CV, third-party job descriptions — passes through
EPAM infrastructure by construction. No local flag changes that; the flags only
reduce what is *stored* in the CodeMie platform's own analytics.

Verified state of the three channels:

| Channel | Default | With this launcher |
|---|---|---|
| API traffic through the gateway | EPAM processes everything | unchanged — inherent to the proxy |
| Conversation sync (prompts + responses) | uploaded | **suppressed** |
| Metrics sync (prompt text in `userPrompts`) | uploaded | still uploaded (flag ineffective) |

So the real choice is binary:

- **Unity must not see or pay, EPAM seeing content is acceptable** → this
  setup. That is the decision taken on 2026-07-29.
- **No employer should see the content at all** → drop CodeMie entirely and use
  a personal Anthropic account or a personal API key in the isolated profile
  (`jobpilot` would then call `claude` instead of `codemie-claude`, and the
  profile needs its own `/login`).

## Verify in 30 seconds

```bash
# 1. no Anthropic login in the isolated profile => Unity seat cannot be charged
python3 -c "import json,os;print('oauthAccount' in json.load(open(os.path.expanduser('~/.claude-jobpilot/.claude.json'))))"
# expected: False

# 2. transcripts land in the isolated profile, not the Unity one
ls ~/.claude-jobpilot/projects/-Users-Serhii-Vovna-Documents-Job-search/
ls ~/.claude/projects/-Users-Serhii-Vovna-Documents-Job-search/   # count must not grow

# 3. gateway is live
codemie profile status | grep -E 'Auth Status|API URL'
```

The session banner is the fastest check of all — it must print
`Provider │ ai-run-sso` and `CodeMie URL │ https://codemie.lab.epam.com`.

## Failure modes

| Symptom | Meaning | Fix |
|---|---|---|
| Browser opens on launch | SSO token expired (24h lifetime) | expected once a day; finish the SSO flow |
| `refresh failed. Run: codemie profile login` | refresh token dead | `codemie profile login` |
| “Select login method: 1. Claude account… 2. Anthropic Console… 3. 3rd-party platform” | **first-run onboarding wizard**, not an auth failure. A fresh `CLAUDE_CONFIG_DIR` has no `hasCompletedOnboarding`, and the wizard asks for a login even though the gateway token is present. `-p`/print mode skips the wizard, which is why it only shows up on the first interactive launch. | Ctrl+C, then set the flag (below), then relaunch. Never pick an option — each one attaches an account to this profile |
| Claude Code asks you to log in *after* onboarding is done | gateway supplied no token — you are one step away from using a personal/Unity account | quit, check `codemie profile status`, do **not** log in |
| Session banner shows no CodeMie URL | you started plain `claude`, not `jobpilot` | quit and relaunch |
| `Not logged in · Please run /login`, and no CodeMie banner appeared | the wrapper never ran, so no gateway token was injected and plain `claude` started in the isolated profile. Nothing is billed — the request just fails. Two known causes: a leftover shell **function** shadowing the script (`type -a jobpilot`), or the **version prompt** below aborting the wrapper. | `unfunction jobpilot; hash -r`, then check the pinned version. Do **not** log in |
| `⚠️ WARNING: You are running Claude Code v2.1.220 / CodeMie has only tested v2.1.218` + `What would you like to do?` | Claude Code auto-updated itself past the version CodeMie 0.10.1 verifies. Interactively it blocks on that prompt; non-interactively it crashes with `ERR_USE_AFTER_CLOSE`. Either way the session can end up on plain `claude`. | re-pin the version (below) |

### Claude Code version must stay pinned to what CodeMie verifies

CodeMie CLI 0.10.1 verifies **Claude Code 2.1.218**. `~/.local/bin/claude` is a
symlink shared with work sessions, and Claude Code auto-updates itself — on
2026-07-29 a plain `claude` run bumped it to 2.1.220 at 22:27, which broke
`jobpilot` in exactly the confusing way described in the failure table.

`DISABLE_AUTOUPDATER=1` in the launcher stops **jobpilot** sessions from bumping
it, but a Unity work session still can. To re-pin (no download needed if the
version is already on disk):

```bash
ls ~/.local/share/claude/versions/            # what is available
ln -sfn ~/.local/share/claude/versions/2.1.218 ~/.local/bin/claude
readlink ~/.local/bin/claude                  # verify
```

`codemie install claude --supported` does the same thing but asks for
confirmation on a TTY, so it cannot be scripted. Check which version CodeMie
expects with `codemie doctor`. Rolling forward again is `claude update`.

### Suppressing the onboarding wizard in a fresh profile

Applied 2026-07-29 to `~/.claude-jobpilot/.claude.json`. Needed again only if the
profile is recreated from scratch:

```bash
python3 - <<'PY'
import json, os
p = os.path.expanduser('~/.claude-jobpilot/.claude.json')
d = json.load(open(p))
d['hasCompletedOnboarding'] = True
d['lastOnboardingVersion'] = '2.1.220'   # any recent version string works
json.dump(d, open(p, 'w'), indent=2)
PY
```

Both keys are read by the `claude` binary (verified against 2.1.218). The theme
prompt is harmless and stores `"theme"` in the profile's `settings.json`.

## Daily ritual — refresh the CodeMie token

The CodeMie SSO token lives ~24h. Once a day, from inside a `jobpilot` session,
run this single command to push the current token to GitHub Actions:

```bash
gh secret set JOBPILOT_CODEMIE_TOKEN --repo serepanSmart/job-pilot <<< $ANTHROPIC_AUTH_TOKEN
```

That is all. The command reads `ANTHROPIC_AUTH_TOKEN` (the live CodeMie token
injected by `codemie-claude`), and stores it as the `JOBPILOT_CODEMIE_TOKEN`
GitHub Actions secret. The cron pipeline uses it until it expires; scoring
degrades gracefully when it does (fetchers and dedupe still run).

**Local pipeline** (`npm run pipeline`) needs no manual export — the `start`
script auto-falls-back to `ANTHROPIC_AUTH_TOKEN` when `JOBPILOT_CODEMIE_TOKEN`
is not explicitly set.

For a long-lived CI token (EPAM service account), see `DEPLOY.md` Step 4.

## Model

The active profile (`claude-4-6`) pins **Sonnet 4.6** as the default, with
`ANTHROPIC_DEFAULT_OPUS_MODEL` → `claude-opus-4-6-20260205` and
`ANTHROPIC_DEFAULT_HAIKU_MODEL` → `claude-haiku-4-5-20251001`. `/model` inside a
session switches tiers. Newer models (Opus 5 / Sonnet 5) are only available if
the CodeMie catalog exposes them — check `codemie models`.

## Local artifacts CodeMie writes

- `~/.codemie/sessions/<id>_{conversation,metrics}.jsonl` — per-session capture
  queue. With the launcher, no `_conversation.jsonl` is created; the
  `_metrics.jsonl` still appears and still uploads (`syncStatus: synced`) with
  user prompt text in it.
- `~/.codemie/logs/debug-<date>.log` — also contains prompt text. Local only.
- `docs/codemie/analytics/*.json` — written **into this repo**. Git-ignored via
  `docs/codemie/`; delete freely.
- `~/.claude/settings.json` may get a temporary `statusLine` key injected and
  removed by CodeMie. Harmless, and irrelevant to `jobpilot` sessions.

## Already spent, not recoverable

Every session on this project before **2026-07-29 ~22:00** ran on the Unity
OAuth seat with the Unity OTEL exporter enabled (tool-level detail, but not
prompt text — `OTEL_LOG_USER_PROMPTS` was never set). Switching profiles stops
future reporting; it does not retract what was already sent.
