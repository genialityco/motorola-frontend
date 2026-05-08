import { auth } from '@/lib/firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function getToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No autenticado. Inicia sesión.');
  return token;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
}

async function request<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;
  const headers: Record<string, string> = {};

  if (requiresAuth) {
    const token = await getToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  let bodyInit: BodyInit | undefined;
  if (body instanceof FormData) {
    bodyInit = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyInit = JSON.stringify(body);
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { method, headers, body: bodyInit });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Error ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string, requiresAuth = true) =>
    request<T>(path, { requiresAuth }),

  post: <T>(path: string, body?: unknown, requiresAuth = true) =>
    request<T>(path, { method: 'POST', body, requiresAuth }),

  patch: <T>(path: string, body: unknown, requiresAuth = true) =>
    request<T>(path, { method: 'PATCH', body, requiresAuth }),

  delete: <T = void>(path: string, requiresAuth = true) =>
    request<T>(path, { method: 'DELETE', requiresAuth }),

  postForm: <T>(path: string, formData: FormData, requiresAuth = true) =>
    request<T>(path, { method: 'POST', body: formData, requiresAuth }),
};
