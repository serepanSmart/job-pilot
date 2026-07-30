'use server';

import { JOB_STATUSES, getDb, jobs } from '@jobpilot/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(JOB_STATUSES),
});

const notesInput = z.object({
  id: z.string().uuid(),
  notes: z.string().max(10_000),
});

export async function setJobStatus(
  id: string,
  status: string
): Promise<{ readonly error?: string; readonly ok: boolean }> {
  const parsed = statusInput.safeParse({ id, status });
  if (!parsed.success) {
    return { error: 'Invalid status update.', ok: false };
  }

  const now = new Date();
  const patch: Record<string, unknown> = {
    status: parsed.data.status,
    updatedAt: now,
  };

  if (parsed.data.status === 'applied') {
    patch.dateApplied = now;
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    patch.followUpDue = due;
  }

  await getDb().update(jobs).set(patch).where(eq(jobs.id, parsed.data.id));

  revalidatePath('/');
  revalidatePath('/pipeline');
  revalidatePath('/stats');
  revalidatePath(`/job/${parsed.data.id}`);

  return { ok: true };
}

export async function setJobNotes(
  id: string,
  notes: string
): Promise<{ readonly error?: string; readonly ok: boolean }> {
  const parsed = notesInput.safeParse({ id, notes });
  if (!parsed.success) {
    return { error: 'Notes are too long.', ok: false };
  }

  await getDb()
    .update(jobs)
    .set({ notes: parsed.data.notes, updatedAt: new Date() })
    .where(eq(jobs.id, parsed.data.id));

  revalidatePath(`/job/${parsed.data.id}`);

  return { ok: true };
}
