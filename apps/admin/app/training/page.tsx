import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { EmptyRows, HiddenId, Status } from '../../components/ui';
import { createTrainingTemplate, deleteTrainingTemplate, updateTrainingTemplate } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function TrainingPage() {
  const templates = await apiList('/admin/training-templates');

  return (
    <AdminShell
      title="Тренировочный дневник"
      subtitle="Шаблоны тренировок для пирамиды, которые видны в мобильном приложении."
      action={
        <CreateModal buttonLabel="Создать шаблон" title="Новый шаблон">
          <form className="form" action={createTrainingTemplate}>
            <label className="field"><span>Название</span><input className="input" name="title" required /></label>
            <label className="field"><span>Цель</span><input className="input" name="target" /></label>
            <label className="field"><span>Метрика</span><input className="input" name="metric" /></label>
            <label className="field"><span>Порядок</span><input className="input" name="sortOrder" type="number" defaultValue="0" /></label>
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
          <h2>Шаблоны</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Цель</th><th>Метрика</th><th>Порядок</th><th>Статус</th><th>Действия</th></tr></thead>
            <tbody>
              {templates.length === 0 ? <EmptyRows label="Шаблонов пока нет" /> : null}
              {templates.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td>{row.target ?? '-'}</td>
                  <td>{row.metric ?? '-'}</td>
                  <td>{row.sort_order ?? 0}</td>
                  <td><Status value={row.status} /></td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать шаблон ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updateTrainingTemplate}>
                          <HiddenId row={row} />
                          <label className="field"><span>Название</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                          <label className="field"><span>Цель</span><input className="input" name="target" defaultValue={String(row.target ?? '')} /></label>
                          <label className="field"><span>Метрика</span><input className="input" name="metric" defaultValue={String(row.metric ?? '')} /></label>
                          <label className="field"><span>Порядок</span><input className="input" name="sortOrder" type="number" defaultValue={String(row.sort_order ?? 0)} /></label>
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <ConfirmModal buttonLabel={`Удалить шаблон ${row.title}`} title="Удалить шаблон?" message="Шаблон будет удален из тренировочного дневника. Действие нельзя отменить.">
                        <form action={deleteTrainingTemplate}>
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
