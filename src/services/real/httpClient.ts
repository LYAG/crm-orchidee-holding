'use client';

/**
 * Client HTTP partagé par tous les *ServiceReal. Le backend (api_crm, Spring Boot)
 * répond systématiquement en JSON, avec un corps d'erreur `{ message: string }`
 * (voir GlobalExceptionHandler côté backend) — c'est ce message qu'on relaie tel
 * quel via `Error.message`, exactement comme le faisaient les mocks.
 */

const TOKEN_KEY = 'crm_auth_token';
const USER_KEY = 'crm_auth_user';

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';
}

export function getToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>(): T | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

interface ErrorResponse {
  message?: string;
}

/** Erreur HTTP avec le statut attaché, pour permettre aux appelants de distinguer un 404 attendu d'une vraie panne. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ErrorResponse;
    if (body?.message) return body.message;
  } catch {
    // Corps non-JSON (proxy, timeout...) — on retombe sur le statut HTTP.
  }
  return `Erreur serveur (${res.status}).`;
}

function withAuthHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return headers;
}

/** Appel JSON standard. Renvoie `undefined` pour les réponses 204 No Content. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { ...options, headers: withAuthHeaders(options) });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res), res.status);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Appel renvoyant du texte brut (ex. export CSV en text/csv). */
export async function apiFetchText(path: string, options: RequestInit = {}): Promise<string> {
  const res = await fetch(`${baseUrl()}${path}`, { ...options, headers: withAuthHeaders(options) });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res), res.status);
  return res.text();
}

/** Construit une query string en omettant les valeurs undefined/null/''. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}
