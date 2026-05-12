import { apiFetch } from '../../shared/lib/api';
import { NewsPost } from './types';

type ApiList<T> = { data: T[] };

export async function getNews() {
  return apiFetch<ApiList<NewsPost>>('/news');
}
