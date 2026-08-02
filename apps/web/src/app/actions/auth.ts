'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isPasswordCorrect,
} from '@/lib/session';

const RL_UNTIL_COOKIE = 'rl_until';
const RL_DELAY_COOKIE = 'rl_delay';
const INITIAL_DELAY_MS = 2_000;
const MAX_DELAY_MS = 3_600_000;
const IS_PROD = process.env.NODE_ENV === 'production';

export interface LoginState {
  readonly error?: string;
}

export const login = async (
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const store = await cookies();

  const blockedUntil = Number(store.get(RL_UNTIL_COOKIE)?.value ?? 0);
  if (Date.now() < blockedUntil) {
    const secsLeft = Math.ceil((blockedUntil - Date.now()) / 1000);
    return { error: `Too many attempts. Try again in ${secsLeft}s.` };
  }

  const password = formData.get('password');
  const next = formData.get('next');

  if (typeof password !== 'string' || !password.length) {
    return { error: 'Enter your password.' };
  }

  if (!isPasswordCorrect(password)) {
    const prevDelay = Number(store.get(RL_DELAY_COOKIE)?.value ?? 0);
    const delay = Math.min(
      prevDelay > 0 ? prevDelay * 2 : INITIAL_DELAY_MS,
      MAX_DELAY_MS
    );
    const maxAgeSec = Math.ceil(delay / 1000) + 60;
    store.set(RL_UNTIL_COOKIE, String(Date.now() + delay), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: IS_PROD,
      maxAge: maxAgeSec,
    });
    store.set(RL_DELAY_COOKIE, String(delay), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: IS_PROD,
      maxAge: maxAgeSec,
    });
    return { error: 'Incorrect password.' };
  }

  store.delete(RL_UNTIL_COOKIE);
  store.delete(RL_DELAY_COOKIE);

  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: IS_PROD,
  });

  const target =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/';

  redirect(target);
};

export const logout = async (): Promise<void> => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
};
