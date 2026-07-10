import { apiFetch } from '../../shared/lib/api';

export type ProfileStatus = {
  id: string;
  label: string;
  description?: string | null;
  sort_order: number;
};

type ApiList<T> = { data: T[] };

export function getProfileStatuses() {
  return apiFetch<ApiList<ProfileStatus>>('/profile-statuses');
}
