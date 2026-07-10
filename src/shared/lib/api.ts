export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_AUTH_TOKEN = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN;

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  error?: string;
};

export class ApiRequestError extends Error implements ApiError {
  status: number;
  code?: string;
  error?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.status = error.status;
    this.code = error.code;
    this.error = error.error;
  }
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export function apiAuthHeaders(): Record<string, string> {
  return DEV_AUTH_TOKEN ? { Authorization: `Bearer ${DEV_AUTH_TOKEN}` } : {};
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  Object.entries(apiAuthHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new ApiRequestError(await normalizeApiError(response));
  }

  return response.json() as Promise<T>;
}

export async function normalizeApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiError> = {};

  try {
    body = await response.json();
  } catch {
    body = {};
  }

  return {
    status: response.status,
    message: body.message ?? body.error ?? 'Request failed',
    code: body.code ?? body.error,
  };
}
