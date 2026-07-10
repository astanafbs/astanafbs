import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { ImageField } from '../../components/file-field';
import { IconButton } from '../../components/icons';
import { EmptyRows, HiddenId, ImagePreview, Money, Status, toTengeInput } from '../../components/ui';
import { createProduct, deleteProduct, updateProduct } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function ProductsPage() {
  const products = await apiList('/admin/products');

  return (
    <AdminShell
      title="Товары"
      subtitle="Каталог магазина и заявки на заказ."
      action={
        <CreateModal buttonLabel="Создать товар" title="Новый товар">
          <form className="form" action={createProduct}>
            <label className="field"><span>Название</span><input className="input" name="title" required /></label>
            <label className="field"><span>Описание</span><textarea className="textarea" name="description" /></label>
            <label className="field"><span>Цена, ₸</span><input className="input" name="priceCents" type="number" defaultValue="0" /></label>
            <ImageField name="imageKey" label="Фото" />
            <label className="field">
              <span>Статус</span>
              <select className="select" name="status">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <button className="button" type="submit">Создать</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
          <h2>Каталог</h2>
          <table className="table">
            <thead><tr><th>Фото</th><th>Название</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
            <tbody>
              {products.length === 0 ? <EmptyRows label="Товаров пока нет" /> : null}
              {products.map((row) => (
                <tr key={String(row.id)}>
                  <td><ImagePreview value={row.image_key} label={String(row.title)} /></td>
                  <td>{row.title}</td>
                  <td><Money value={row.price_cents} /></td>
                  <td><Status value={row.status} /></td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать товар ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updateProduct}>
                          <HiddenId row={row} />
                          <label className="field"><span>Название</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                          <label className="field"><span>Описание</span><textarea className="textarea" name="description" defaultValue={String(row.description ?? '')} /></label>
                          <label className="field"><span>Цена, ₸</span><input className="input" name="priceCents" type="number" defaultValue={toTengeInput(row.price_cents)} /></label>
                          <ImageField name="imageKey" label="Фото" defaultValue={String(row.image_key ?? '')} />
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <form action={updateProduct}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value={row.status === 'published' ? 'draft' : 'published'} />
                        <IconButton icon={row.status === 'published' ? 'eyeOff' : 'publish'} label={row.status === 'published' ? 'Скрыть' : 'Опубликовать'} tone={row.status === 'published' ? 'warning' : 'success'} type="submit" />
                      </form>
                      <ConfirmModal buttonLabel={`Удалить товар ${row.title}`} title="Удалить товар?" message="Товар будет удален из каталога. Действие нельзя отменить.">
                        <form action={deleteProduct}>
                          <HiddenId row={row} />
                          <button className="button danger" type="submit">Удалить</button>
                        </form>
                      </ConfirmModal>
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
