import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_AUTH_TOKEN = process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN;

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  error?: string;
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    Platform.OS === 'web' ? null : await auth().currentUser?.getIdToken().catch(() => null);
  const authToken = token ?? DEV_AUTH_TOKEN;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw await normalizeApiError(response);
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
