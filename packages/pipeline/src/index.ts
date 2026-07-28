/**
 * Discovery pipeline entry point.
 *
 * Phase 2 implements stages 1-3 (fetch → dedupe → hard filters) and Phase 3
 * adds stage 4 (LlmScorer via `claude -p`) and stage 5 (Resend digest).
 * See CLAUDE.md "Pipeline stages".
 */

import { JOB_STATUSES, SCORE_THRESHOLD } from '@jobpilot/db';

console.info(
  '[pipeline] skeleton ready — %d statuses, score threshold %d',
  JOB_STATUSES.length,
  SCORE_THRESHOLD
);
