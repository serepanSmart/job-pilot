import { z } from 'zod';

export const SESSION_COOKIE = 'jobpilot_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const envSchema = z.object({
  DASHBOARD_PASSWORD: z
    .string()
    .min(8, 'DASHBOARD_PASSWORD must be at least 8 characters'),
});

function readPassword(): string {
  const parsed = envSchema.safeParse({
    DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD,
  });

  if (!parsed.success) {
    throw new Error(
      'DASHBOARD_PASSWORD is missing or too short. Set it in .env — see ' +
        '.env.example.'
    );
  }

  return parsed.data.DASHBOARD_PASSWORD;
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isPasswordCorrect(candidate: string): boolean {
  return timingSafeEqual(candidate, readPassword());
}

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt, readPassword());
  return `${issuedAt}.${signature}`;
}

export async function isSessionTokenValid(
  token: string | undefined
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const separator = token.lastIndexOf('.');
  if (separator <= 0) {
    return false;
  }

  const issuedAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) {
    return false;
  }

  const ageSeconds = (Date.now() - issuedAtMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  let expected: string;
  try {
    expected = await sign(issuedAt, readPassword());
  } catch {
    return false;
  }

  return timingSafeEqual(signature, expected);
}
