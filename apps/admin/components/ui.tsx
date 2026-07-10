import { Row } from '../lib/api';

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  registration_open: 'Регистрация',
  registration_closed: 'Закрыто',
  in_progress: 'Идет',
  completed: 'Завершен',
  cancelled: 'Отменен',
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  waitlist: 'Лист ожидания',
  rejected: 'Отклонено',
  scheduled: 'Запланирован',
  live: 'В игре',
  published: 'Опубликовано',
  archived: 'Архив',
  moderation: 'Модерация',
  enabled: 'Включен',
  disabled: 'Выключен',
  user: 'Пользователь',
  club_admin: 'Админ клуба',
  superadmin: 'Суперадмин',
  admin: 'Админ',
  player: 'Игрок',
  image: 'Изображение',
};

export function Status({ value }: { value: string | number | boolean | null | undefined }) {
  const rawValue = value == null ? 'none' : String(value);
  return <span className="status">{statusLabels[rawValue] ?? rawValue}</span>;
}

export function Money({ value }: { value: string | number | boolean | null | undefined }) {
  const amount = Number(value ?? 0) / 100;
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toTengeInput(value: string | number | boolean | null | undefined) {
  if (value == null || value === '') return '';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  return String(Math.round(amount / 100));
}

export function ImagePreview({
  value,
  label,
}: {
  value: string | number | boolean | null | undefined;
  label: string;
}) {
  const rawValue = typeof value === 'string' ? value.trim() : '';
  const src = rawValue.startsWith('http://') || rawValue.startsWith('https://')
    ? rawValue
    : rawValue
      ? `${publicApiUrl}/files/${rawValue.split('/').map(encodeURIComponent).join('/')}`
      : null;
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="image-preview">
      {src ? <img src={src} alt={label} /> : <span>{initials || 'IMG'}</span>}
    </div>
  );
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
