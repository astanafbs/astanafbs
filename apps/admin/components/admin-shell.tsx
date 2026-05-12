import Link from 'next/link';

const nav = [
  ['/', 'Dashboard'],
  ['/tournaments', 'Турниры'],
  ['/matches', 'Матчи'],
  ['/news', 'Новости'],
  ['/clubs', 'Клубы'],
  ['/users', 'Пользователи'],
  ['/listings', 'Объявления'],
  ['/products', 'Товары'],
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
        <div className="brand">FBS</div>
        <nav className="nav">
          {nav.map(([href, label]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">FBS Astana Admin</p>
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
