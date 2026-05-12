const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const adminToken = process.env.ADMIN_API_TOKEN ?? 'dev-admin-token';

export type AdminSummary = {
  tournaments: string;
  users: string;
  listings: string;
  push_tokens: string;
  news: string;
  products: string;
};

export type Row = Record<string, string | number | boolean | null>;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'x-admin-token': adminToken,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function apiList<T extends Row>(path: string) {
  const result = await apiFetch<{ data: T[] }>(path);
  return result.data;
}

export async function getAdminData() {
  const [summary, tournaments, news, users, listings, products, registrations, matches] = await Promise.all([
    apiFetch<{ data: AdminSummary }>('/admin/summary'),
    apiList('/admin/tournaments'),
    apiList('/admin/news'),
    apiList('/admin/users'),
    apiList('/admin/listings'),
    apiList('/admin/products'),
    apiList('/admin/registrations'),
    apiList('/admin/matches'),
  ]);

  return {
    summary: summary.data,
    tournaments,
    news,
    users,
    listings,
    products,
    registrations,
    matches,
  };
}

export async function adminCreate(path: string, payload: Record<string, unknown>) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminPatch(path: string, payload: Record<string, unknown>) {
  return apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminDelete(path: string) {
  return apiFetch(path, {
    method: 'DELETE',
  });
}
