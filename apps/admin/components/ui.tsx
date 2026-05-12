import { Row } from '../lib/api';

export function Status({ value }: { value: string | number | boolean | null | undefined }) {
  return <span className="status">{value ?? 'none'}</span>;
}

export function Money({ value }: { value: string | number | boolean | null | undefined }) {
  const amount = Number(value ?? 0) / 100;
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EmptyRows({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={8} className="empty-cell">
        {label}
      </td>
    </tr>
  );
}

export function HiddenId({ row }: { row: Row }) {
  return <input type="hidden" name="id" value={String(row.id)} />;
}

export function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return 'не указано';
  return new Intl.DateTimeFormat('ru-KZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function toDateTimeInput(value: unknown) {
  if (!value || typeof value !== 'string') return '';
  return new Date(value).toISOString().slice(0, 16);
}
