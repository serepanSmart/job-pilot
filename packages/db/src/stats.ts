import './load-env';
import { sql } from 'drizzle-orm';
import { getDb } from './index';

const db = getDb();
const seen = await db.execute(
  sql`SELECT COUNT(*)::int AS cnt FROM seen_hashes`
);
const statuses = await db.execute(
  sql`SELECT status, COUNT(*)::int AS cnt FROM jobs GROUP BY status ORDER BY cnt DESC`
);
const top = await db.execute(
  sql`SELECT score, status, source, role, company FROM jobs ORDER BY score DESC NULLS LAST LIMIT 30`
);

console.info('seen_hashes: %d', (seen.rows[0] as { cnt: number }).cnt);
console.info('jobs:');
for (const row of statuses.rows) {
  const r = row as { status: string; cnt: string };
  console.info(' ', r.status.padEnd(15), r.cnt);
}
console.info('\ntop 30 by score:');
for (const r of top.rows) {
  const row = r as {
    score: number | null;
    status: string;
    source: string;
    role: string;
    company: string;
  };
  console.info(
    ' [%s] %s | %s | %s @ %s',
    String(row.score ?? '??').padStart(3),
    row.status.padEnd(12),
    row.source.padEnd(14),
    String(row.role).slice(0, 45).padEnd(45),
    String(row.company).slice(0, 30)
  );
}
