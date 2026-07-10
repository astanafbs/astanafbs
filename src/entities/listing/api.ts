import { apiFetch } from '../../shared/lib/api';

export type Listing = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email?: string | null;
  title: string;
  description: string | null;
  category: 'coaches' | 'cues' | 'chalk' | 'cases' | 'tables' | 'misc';
  price_cents: number | null;
  currency: string;
  status: string;
  image_keys: string[];
  published_until?: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getListings() {
  return apiFetch<ApiList<Listing>>('/listings');
}

export async function getListing(id: string) {
  return apiFetch<ApiItem<Listing>>(`/listings/${id}`);
}

export async function createListing(input: {
  title: string;
  description?: string | null;
  category: Listing['category'];
  priceCents?: number | null;
}) {
  return apiFetch<ApiItem<Listing>>('/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
