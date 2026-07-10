import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { EmptyRows, HiddenId, Status } from '../../components/ui';
import { createProfileStatus, deleteProfileStatus, updateProfileStatus } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function ProfileStatusesPage() {
  const profileStatuses = await apiList('/admin/profile-statuses');

  return (
    <AdminShell
      title="Статусы профиля"
      subtitle="Справочник статусов, которые можно назначать игрокам и показывать в приложении."
      action={
        <CreateModal buttonLabel="Добавить статус" title="Новый статус профиля">
          <form className="form" action={createProfileStatus}>
            <label className="field"><span>Название</span><input className="input" name="label" placeholder="Открыт к дуэлям" required /></label>
            <label className="field"><span>Описание</span><textarea className="textarea" name="description" rows={3} /></label>
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
        <h2>Список статусов</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Описание</th>
              <th>Порядок</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {profileStatuses.length === 0 ? <EmptyRows label="Статусов пока нет" /> : null}
            {profileStatuses.map((row) => (
              <tr key={String(row.id)}>
                <td>{row.label}</td>
                <td>{row.description ?? '-'}</td>
                <td>{row.sort_order ?? 0}</td>
                <td><Status value={row.status} /></td>
                <td>
                  <div className="row-actions">
                    <CreateModal buttonIcon="edit" buttonLabel={`Редактировать статус ${row.label}`} title={`Редактировать: ${row.label}`}>
                      <form className="form" action={updateProfileStatus}>
                        <HiddenId row={row} />
                        <label className="field"><span>Название</span><input className="input" name="label" defaultValue={String(row.label)} required /></label>
                        <label className="field"><span>Описание</span><textarea className="textarea" name="description" rows={3} defaultValue={String(row.description ?? '')} /></label>
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
                    <ConfirmModal buttonLabel={`Удалить статус ${row.label}`} title="Удалить статус?" message="У игроков с этим статусом поле будет очищено. Действие нельзя отменить.">
                      <form action={deleteProfileStatus}>
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
