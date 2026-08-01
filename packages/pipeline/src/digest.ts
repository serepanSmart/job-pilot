const RESEND_API = 'https://api.resend.com/emails';

interface DigestJob {
  company: string;
  id: string;
  role: string;
  score: number | null;
  verdict: string | null;
}

function scoreColor(score: number): string {
  if (score >= 80) {
    return '#34D399';
  }
  if (score >= 65) {
    return '#FBBF24';
  }
  return '#FB7185';
}

function buildHtml(jobs: DigestJob[], dashboardUrl: string): string {
  const rows = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:center">
          <span style="font-size:20px;font-weight:700;color:${scoreColor(j.score ?? 0)}">${j.score ?? '-'}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6">
          <a href="${dashboardUrl}/job/${j.id}" style="color:#8B5CF6;text-decoration:none;font-weight:600;font-size:14px">${j.role}</a>
          <div style="color:#6b7280;font-size:12px;margin-top:2px">${j.company}</div>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px">${j.verdict ?? ''}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827">JobPilot</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">
      ${jobs.length} new job${jobs.length === 1 ? '' : 's'} waiting in your Inbox
    </p>
    <table style="width:100%;border-collapse:collapse;font-family:inherit">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 14px;text-align:center;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;width:56px">Score</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em">Role</th>
          <th style="padding:8px 14px;text-align:left;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em">Verdict</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:28px 0 0;text-align:center">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED 0%,#C084FC 100%);color:#fff;text-decoration:none;padding:11px 28px;border-radius:8px;font-weight:600;font-size:14px">
        Open Dashboard
      </a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendDigest(jobs: DigestJob[]): Promise<void> {
  if (!jobs.length) {
    return;
  }

  const apiKey = process.env['RESEND_API_KEY'];
  const to = process.env['DIGEST_EMAIL_TO'];

  if (!apiKey || !to) {
    console.info(
      '[digest] skipped — RESEND_API_KEY or DIGEST_EMAIL_TO not set'
    );
    return;
  }

  const from = process.env['DIGEST_EMAIL_FROM'] ?? 'onboarding@resend.dev';
  const dashboardUrl = (
    process.env['DASHBOARD_URL'] ?? 'http://localhost:3000'
  ).replace(/\/$/, '');

  const sorted = [...jobs].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const subject = `JobPilot: ${jobs.length} new job${jobs.length === 1 ? '' : 's'} found`;

  const res = await fetch(RESEND_API, {
    body: JSON.stringify({
      from,
      html: buildHtml(sorted, dashboardUrl),
      subject,
      to: [to],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      '[digest] Resend error %d: %s',
      res.status,
      body.slice(0, 200)
    );
    return;
  }

  console.info('[digest] sent to %s — %d job(s)', to, jobs.length);
}
