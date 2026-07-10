import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { ImagesField } from '../../components/file-field';
import { EmptyRows, HiddenId, ImagePreview, Money, Status, formatDate, toDateTimeInput, toTengeInput } from '../../components/ui';
import { createListing, deleteListing, updateListing } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'moderation', 'published', 'rejected', 'archived'];
const categories = [
  ['coaches', 'тренера'],
  ['cues', 'кии'],
  ['chalk', 'мелки'],
  ['cases', 'чехлы'],
  ['tables', 'столы'],
  ['misc', 'разное'],
];

export default async function ListingsPage() {
  const [listings, users] = await Promise.all([
    apiList('/admin/listings'),
    apiList('/admin/users'),
  ]);

  return (
    <AdminShell
      title="Объявления"
      subtitle="Модерация инвентаря, услуг и пользовательских публикаций."
      action={
        <CreateModal buttonLabel="Создать объявление" title="Новое объявление">
          <form className="form" action={createListing}>
            <label className="field"><span>Название</span><input className="input" name="title" required /></label>
            <label className="field"><span>Описание</span><textarea className="textarea" name="description" /></label>
            <label className="field">
              <span>Автор</span>
              <select className="select" name="userId">
                <option value="">Без автора</option>
                {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Категория</span>
              <select className="select" name="category">
                {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="field"><span>Цена, ₸</span><input className="input" name="priceCents" type="number" /></label>
            <label className="field"><span>Показывать до</span><input className="input" name="publishedUntil" type="datetime-local" /></label>
            <ImagesField name="imageKeys" label="Фото" />
            <label className="field">
              <span>Статус</span>
              <select className="select" name="status" defaultValue="published">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <button className="button" type="submit">Создать</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
          <h2>Модерация</h2>
          <table className="table">
            <thead><tr><th>Фото</th><th>Название</th><th>Автор</th><th>Категория</th><th>Цена</th><th>Статус</th><th>До</th><th>Действия</th></tr></thead>
            <tbody>
              {listings.length === 0 ? <EmptyRows label="Объявлений пока нет" /> : null}
              {listings.map((row) => (
                <tr key={String(row.id)}>
                  <td><ImagePreview value={Array.isArray(row.image_keys) ? row.image_keys[0] : null} label={String(row.title)} /></td>
                  <td>{row.title}</td>
                  <td>{row.user_name ?? '-'}</td>
                  <td>{row.category}</td>
	                  <td><Money value={row.price_cents} /></td>
	                  <td><Status value={row.status} /></td>
	                  <td>{formatDate(row.published_until)}</td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать объявление ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updateListing}>
                          <HiddenId row={row} />
                          <label className="field"><span>Название</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                          <label className="field"><span>Описание</span><textarea className="textarea" name="description" defaultValue={String(row.description ?? '')} /></label>
                          <label className="field">
                            <span>Категория</span>
                            <select className="select" name="category" defaultValue={String(row.category)}>
                              {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </label>
	                          <label className="field"><span>Цена, ₸</span><input className="input" name="priceCents" type="number" defaultValue={toTengeInput(row.price_cents)} /></label>
	                          <label className="field"><span>Показывать до</span><input className="input" name="publishedUntil" type="datetime-local" defaultValue={toDateTimeInput(row.published_until)} /></label>
                          <ImagesField name="imageKeys" label="Фото" defaultValue={Array.isArray(row.image_keys) ? row.image_keys.join(', ') : ''} />
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <ConfirmModal buttonLabel={`Удалить объявление ${row.title}`} title="Удалить объявление?" message="Объявление будет удалено из маркетплейса. Действие нельзя отменить.">
                        <form action={deleteListing}>
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
