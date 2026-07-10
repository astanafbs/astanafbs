import { API_URL } from './api';

export function money(value?: number | null, currency = 'KZT') {
  if (value == null) return 'по договоренности';
  return `${Math.round(value / 100).toLocaleString('ru-RU')} ${currency === 'KZT' ? '₸' : currency}`;
}

export function shortDate(value?: string | null) {
  if (!value) return 'дата уточняется';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function imageUri(value?: string | null) {
  if (!value) return null;
  if (value.startsWith('http')) return value;
  const path = value.split('/').map(encodeURIComponent).join('/');
  return `${API_URL}/files/${path}`;
}
