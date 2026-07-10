import Link from 'next/link';

import { AdminShell } from '../components/admin-shell';
import { Money, Status, formatDate } from '../components/ui';
import { getAdminData } from '../lib/api';

export default async function AdminDashboard() {
  const data = await getAdminData().catch((error) => ({
    error: error instanceof Error ? error.message : 'Не удалось загрузить API',
  }));

  return (
    <AdminShell
      title="Операционная панель"
      subtitle="Турниры, новости, пользователи, объявления, товары и push-рассылки."
    >
      {'error' in data ? (
        <section className="card dark">
          <h2>API недоступен</h2>
          <p className="muted">{data.error}</p>
        </section>
      ) : (
        <>
          <section className="grid dashboard-metrics">
            {[
              ['Турниры', data.summary.tournaments, '/tournaments'],
              ['Трансляции', data.summary.streams, '/streams'],
              ['Новости', data.summary.news, '/news'],
              ['Пользователи', data.summary.users, '/users'],
              ['Объявления', data.summary.listings, '/listings'],
              ['Товары', data.summary.products, '/products'],
            ].map(([label, value, href]) => (
              <Link className="card" href={href} key={label}>
                <p className="muted">{label}</p>
                <p className="metric">{value}</p>
              </Link>
            ))}
          </section>

          <section className="section card" id="tournaments">
            <h2>Ближайшие турниры</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Клуб</th>
                  <th>Взнос</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.tournaments.slice(0, 5).map((tournament) => (
                  <tr key={String(tournament.id)}>
                    <td>{tournament.title}</td>
                    <td><Status value={tournament.status} /></td>
                    <td>{tournament.club_name ?? 'без клуба'}</td>
                    <td><Money value={tournament.entry_fee_cents} /></td>
                    <td>{formatDate(tournament.starts_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="section card" id="news">
            <h2>Последние новости</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Заголовок</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {data.news.slice(0, 5).map((item) => (
                  <tr key={String(item.id)}>
                    <td>{item.title}</td>
                    <td><Status value={item.status} /></td>
                    <td>{formatDate(item.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </AdminShell>
  );
}
