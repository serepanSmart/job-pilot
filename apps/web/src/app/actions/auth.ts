'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isPasswordCorrect,
} from '@/lib/session';

export interface LoginState {
  readonly error?: string;
}

export async function login(
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get('password');
  const next = formData.get('next');

  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Enter your password.' };
  }

  if (!isPasswordCorrect(password)) {
    return { error: 'Incorrect password.' };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Only allow same-site relative paths — never an absolute URL from input.
  const target =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/';

  redirect(target);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
