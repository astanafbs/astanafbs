import { AdminNav } from './admin-nav';

const nav: Array<[string, string]> = [
  ['/', 'Dashboard'],
  ['/tournaments', 'Турниры'],
  ['/matches', 'Матчи'],
  ['/streams', 'Трансляции'],
  ['/news', 'Новости'],
  ['/clubs', 'Клубы'],
  ['/users', 'Пользователи'],
  ['/profile-statuses', 'Статусы'],
  ['/listings', 'Объявления'],
  ['/products', 'Товары'],
  ['/training', 'Дневник'],
  ['/push', 'Push'],
];

export function AdminShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">BilliardHub</div>
        <AdminNav items={nav} />
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">BilliardHub</p>
            <h1>{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          {action}
        </div>
        {children}
      </section>
    </main>
  );
}
