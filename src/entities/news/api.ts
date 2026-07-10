import { apiFetch } from '../../shared/lib/api';
import { NewsPost } from './types';

type ApiList<T> = { data: T[] };
type ApiItem<T> = { data: T };

export async function getNews() {
  return apiFetch<ApiList<NewsPost>>('/news');
}

export async function getNewsPost(id: string) {
  return apiFetch<ApiItem<NewsPost>>(`/news/${id}`);
}
