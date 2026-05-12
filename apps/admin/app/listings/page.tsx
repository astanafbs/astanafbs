import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Money, Status } from '../../components/ui';
import { deleteListing, updateListing } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'moderation', 'published', 'rejected', 'archived'];

export default async function ListingsPage() {
  const listings = await apiList('/admin/listings');

  return (
    <AdminShell title="Объявления" subtitle="Модерация инвентаря, услуг и пользовательских публикаций.">
      <section className="card">
        <h2>Модерация</h2>
        <table className="table">
          <thead><tr><th>Название</th><th>Автор</th><th>Категория</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            {listings.length === 0 ? <EmptyRows label="Объявлений пока нет" /> : null}
            {listings.map((row) => (
              <tr key={String(row.id)}>
                <td>{row.title}</td>
                <td>{row.user_name ?? '-'}</td>
                <td>{row.category}</td>
                <td><Money value={row.price_cents} /></td>
                <td><Status value={row.status} /></td>
                <td>
                  <div className="row-actions">
                    <form action={updateListing}>
                      <HiddenId row={row} />
                      <input type="hidden" name="status" value={row.status === 'published' ? 'archived' : 'published'} />
                      <button className="button secondary" type="submit">{row.status === 'published' ? 'В архив' : 'Опубликовать'}</button>
                    </form>
                    <form action={deleteListing}>
                      <HiddenId row={row} />
                      <button className="button danger" type="submit">Удалить</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
