import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { ImageField } from '../../components/file-field';
import { IconButton } from '../../components/icons';
import { EmptyRows, HiddenId, ImagePreview, Status, formatDate } from '../../components/ui';
import { createNews, deleteNews, updateNews } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function NewsPage() {
  const news = await apiList('/admin/news');

  return (
    <AdminShell
      title="Новости"
      subtitle="Публикация новостей, баннерных материалов и контента главной."
      action={
        <CreateModal buttonLabel="Создать новость" title="Новая новость">
          <form className="form" action={createNews}>
            <label className="field"><span>Заголовок</span><input className="input" name="title" required /></label>
            <label className="field"><span>Текст</span><textarea className="textarea" name="body" /></label>
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
          <h2>Материалы</h2>
          <table className="table">
            <thead><tr><th>Материал</th><th>Фото</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {news.length === 0 ? <EmptyRows label="Новостей пока нет" /> : null}
              {news.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <strong>{row.title}</strong>
                    <p className="table-note">{String(row.body ?? '').slice(0, 120)}</p>
                  </td>
                  <td><ImagePreview value={row.image_key} label={String(row.title)} /></td>
                  <td><Status value={row.status} /></td>
                  <td>{formatDate(row.published_at ?? row.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать новость ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updateNews}>
                          <HiddenId row={row} />
                          <label className="field"><span>Заголовок</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                          <label className="field"><span>Текст</span><textarea className="textarea" name="body" defaultValue={String(row.body ?? '')} /></label>
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
                      <form action={updateNews}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value={row.status === 'published' ? 'draft' : 'published'} />
                        <IconButton icon={row.status === 'published' ? 'archive' : 'publish'} label={row.status === 'published' ? 'В черновик' : 'Опубликовать'} tone={row.status === 'published' ? 'warning' : 'success'} type="submit" />
                      </form>
                      <ConfirmModal buttonLabel={`Удалить новость ${row.title}`} title="Удалить новость?" message="Материал будет удален из админки и приложения. Действие нельзя отменить.">
                        <form action={deleteNews}>
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
