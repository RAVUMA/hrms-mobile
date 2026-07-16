// Overridable per-environment via .env.local (VITE_SITE_BASE_URL) so local
// dev can point at a local Django backend instead of always hitting
// production - see .env.local.example.
export const SITE_BASE_URL =
  import.meta.env.VITE_SITE_BASE_URL ?? 'https://hrms.hjholdings.lk';
export const BASE_URL = `${SITE_BASE_URL}/api`;

const TOKEN_KEY = 'hj_access_token';
const EMPLOYEE_KEY = 'hj_employee';
const GEOFENCING_KEY = 'hj_geofencing';

export class UnauthorizedError extends Error {}

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

type Listener = (loggedIn: boolean) => void;
const listeners = new Set<Listener>();

/** Lets React components (the session gate) react to login/logout from anywhere. */
export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyAuthChange(loggedIn: boolean) {
  listeners.forEach((l) => l(loggedIn));
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmployee(): Record<string, unknown> | null {
  const raw = localStorage.getItem(EMPLOYEE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isGeoFencingEnabled(): boolean {
  return localStorage.getItem(GEOFENCING_KEY) === 'true';
}

export function saveSession(
  token: string,
  employee: Record<string, unknown>,
  geoFencing: boolean,
) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
  localStorage.setItem(GEOFENCING_KEY, String(geoFencing));
  notifyAuthChange(true);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_KEY);
  localStorage.removeItem(GEOFENCING_KEY);
}

export function logout() {
  clearSession();
  notifyAuthChange(false);
}

/** Resolves the API's bare relative media paths (e.g. `/media/...`) into
 * loadable absolute URLs - the server doesn't build absolute URIs itself. */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_BASE_URL}${path}`;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function decodeOrThrow(response: Response, authenticated: boolean) {
  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    // non-JSON body, leave `body` empty
  }

  if (response.status === 401) {
    const message = authenticated
      ? ((body.detail as string) ?? 'Session expired, please log in again.')
      : ((body.error as string) ?? (body.detail as string) ?? 'Invalid credentials');
    if (authenticated) {
      logout();
    }
    throw new UnauthorizedError(message);
  }
  if (!response.ok) {
    const message =
      (body.error as string) ??
      (body.message as string) ??
      (body.detail as string) ??
      `Something went wrong (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return body;
}

export async function apiGet(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  return decodeOrThrow(response, true);
}

export async function apiPost(
  path: string,
  body?: Record<string, unknown>,
  authenticated = true,
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authenticated
      ? authHeaders()
      : { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return decodeOrThrow(response, authenticated);
}

/** Like apiPost, but returns (status, body) instead of throwing on non-2xx -
 * used where the app needs to inspect e.g. clock-in/out's 400 responses. */
export async function apiPostRaw(
  path: string,
  body?: Record<string, unknown>,
): Promise<[number, Record<string, unknown>]> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  let decoded: Record<string, unknown> = {};
  try {
    decoded = await response.json();
  } catch {
    // ignore
  }
  if (response.status === 401) {
    const message = (decoded.detail as string) ?? 'Session expired, please log in again.';
    logout();
    throw new UnauthorizedError(message);
  }
  return [response.status, decoded];
}

export async function apiPut(path: string, body?: Record<string, unknown>) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return decodeOrThrow(response, true);
}

export async function apiDelete(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return decodeOrThrow(response, true);
}
