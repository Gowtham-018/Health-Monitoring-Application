import { createContext } from 'react';

export type AuthState = {
  token: string;
  email: string;
  role: 'admin' | 'user';
} | null;

export const AuthContext = createContext<{
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
}>({
  auth: null,
  setAuth: () => null,
});

const STORAGE_KEY = 'pulsemate_auth';

export function getStoredAuth(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthState) {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export async function signupApi(email: string, password: string, role: 'user' | 'admin') {
  const response = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).detail || 'Signup failed');
  }

  return response.json();
}

export async function loginApi(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password });
  const response = await fetch('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error((await response.json()).detail || 'Login failed');
  }

  return response.json();
}

export async function fetchProtected<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch protected resource');
  }
  return response.json();
}
