import { apiFetch } from '../../shared/lib/api';

export type Club = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  phone: string | null;
  image_key: string | null;
  two_gis_url: string | null;
};

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getClubs() {
  return apiFetch<ApiList<Club>>('/clubs');
}

export async function getClub(id: string) {
  return apiFetch<ApiItem<Club>>(`/clubs/${id}`);
}
