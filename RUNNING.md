# RUNNING.md — how to start a session, and who pays for it

Written 2026-07-29. Companion to `CLAUDE.md` (the spec) and `DEPLOY.md`
(hosting). This file answers exactly two questions: **what command starts a
session for this project**, and **which account gets billed**.

## TL;DR

```bash
cd ~/Documents/Job\ search
jobpilot
```

`jobpilot` is a zsh function defined in `~/.zshrc` (outside git — it holds no
secrets, but it is machine-local). It is the *only* approved way to open a
Claude Code session for this repo.

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
| pipeline (Phase 3+) | `JOBPILOT_ANTHROPIC_API_KEY` / `JOBPILOT_CLAUDE_CODE_OAUTH_TOKEN` | personal | none |

The rule this encodes: **Unity must neither see nor pay for this project.**
Hard constraint #8 in `CLAUDE.md` is the same rule for pipeline code.

Note the ⚠️ row: running `codemie-claude` by hand is *not* equivalent to
`jobpilot`. The wrapper does not set `CLAUDE_CONFIG_DIR`, so the session reads
`~/.claude/settings.json` — which is where the Unity OTEL exporter lives.

## What the launcher does, and why each line matters

```bash
jobpilot() {
  ( unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL
    unset CLAUDE_CODE_ENABLE_TELEMETRY OTEL_EXPORTER_OTLP_ENDPOINT OTEL_EXPORTER_OTLP_PROTOCOL
    unset OTEL_METRICS_EXPORTER OTEL_LOGS_EXPORTER OTEL_RESOURCE_ATTRIBUTES OTEL_LOG_TOOL_DETAILS
    if ! codemie profile status 2>/dev/null | grep -q '✓ Authenticated'; then
      print -u2 "jobpilot: CodeMie SSO expired — opening browser to re-authenticate…"
      codemie profile refresh || {
        print -u2 "jobpilot: refresh failed. Run: codemie profile login"
        exit 1
      }
    fi
    CLAUDE_CONFIG_DIR="$HOME/.claude-jobpilot" CODEMIE_CONV_SYNC_DISABLED=1 \
      codemie-claude "$@" )
}
```

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
| Claude Code asks you to log in to Anthropic | gateway supplied no token — you are one step away from using a personal/Unity account | quit, fix the profile, do **not** log in |
| Session banner shows no CodeMie URL | you started plain `claude`, not `jobpilot` | quit and relaunch |

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
