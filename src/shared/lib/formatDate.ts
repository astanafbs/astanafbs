export function formatDateLabel(value: string | Date) {
  if (typeof value === 'string') {
    return value;
  }

  return new Intl.DateTimeFormat('ru-KZ', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
