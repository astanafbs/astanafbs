import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Status, formatDate } from '../../components/ui';
import { createNews, deleteNews, updateNews } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function NewsPage() {
  const news = await apiList('/admin/news');

  return (
    <AdminShell title="Новости" subtitle="Публикация новостей, баннерных материалов и контента главной.">
      <section className="resource-layout">
        <form className="card form" action={createNews}>
          <h2>Новая новость</h2>
          <label className="field"><span>Заголовок</span><input className="input" name="title" required /></label>
          <label className="field"><span>Текст</span><textarea className="textarea" name="body" /></label>
          <label className="field">
            <span>Статус</span>
            <select className="select" name="status">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <button className="button" type="submit">Создать</button>
        </form>

        <section className="card">
          <h2>Материалы</h2>
          <table className="table">
            <thead><tr><th>Заголовок</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {news.length === 0 ? <EmptyRows label="Новостей пока нет" /> : null}
              {news.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td><Status value={row.status} /></td>
                  <td>{formatDate(row.published_at ?? row.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <form action={updateNews}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value={row.status === 'published' ? 'draft' : 'published'} />
                        <button className="button secondary" type="submit">{row.status === 'published' ? 'В черновик' : 'Опубликовать'}</button>
                      </form>
                      <form action={deleteNews}>
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
