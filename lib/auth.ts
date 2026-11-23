const AUTH_TOKEN_KEY = 'arswift-auth-token';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearAuthAndRedirectToLogin(): void {
  setStoredAuthToken(null);
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

/** Attach Authorization header; redirect to /login on 401 (except login call). */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getStoredAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/api/auth/login')) {
    clearAuthAndRedirectToLogin();
  }

  return res;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export async function loginWithPassword(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success || !json.token) {
    throw new Error(json.message || 'Invalid email or password');
  }

  setStoredAuthToken(json.token);
}