import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Money, Status } from '../../components/ui';
import { createProduct, deleteProduct, updateProduct } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function ProductsPage() {
  const products = await apiList('/admin/products');

  return (
    <AdminShell title="Товары" subtitle="Каталог магазина и заявки на заказ.">
      <section className="resource-layout">
        <form className="card form" action={createProduct}>
          <h2>Новый товар</h2>
          <label className="field"><span>Название</span><input className="input" name="title" required /></label>
          <label className="field"><span>Описание</span><textarea className="textarea" name="description" /></label>
          <label className="field"><span>Цена, тиын</span><input className="input" name="priceCents" type="number" defaultValue="0" /></label>
          <label className="field">
            <span>Статус</span>
            <select className="select" name="status">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button className="button" type="submit">Создать</button>
        </form>

        <section className="card">
          <h2>Каталог</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
            <tbody>
              {products.length === 0 ? <EmptyRows label="Товаров пока нет" /> : null}
              {products.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td><Money value={row.price_cents} /></td>
                  <td><Status value={row.status} /></td>
                  <td>
                    <div className="row-actions">
                      <form action={updateProduct}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value={row.status === 'published' ? 'draft' : 'published'} />
                        <button className="button secondary" type="submit">{row.status === 'published' ? 'Скрыть' : 'Опубликовать'}</button>
                      </form>
                      <form action={deleteProduct}>
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
      </section>
    </AdminShell>
  );
}
