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

export const login = async (
  _previous: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const password = formData.get('password');
  const next = formData.get('next');

  if (typeof password !== 'string' || !password.length) {
    return { error: 'Enter your password.' };
  }

  if (!isPasswordCorrect(password)) {
    return { error: 'Incorrect password.' };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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
