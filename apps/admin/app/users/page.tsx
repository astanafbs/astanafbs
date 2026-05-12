import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Status } from '../../components/ui';
import { updateUser } from '../../lib/actions';
import { apiList } from '../../lib/api';

const roles = ['player', 'club_owner', 'organizer', 'admin'];

export default async function UsersPage() {
  const users = await apiList('/admin/users');

  return (
    <AdminShell title="Пользователи" subtitle="Профили игроков, роли, рейтинги и клубная принадлежность.">
      <section className="card">
        <h2>Игроки и админы</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Рейтинг</th>
              <th>Клуб</th>
              <th>W/L</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? <EmptyRows label="Пользователей пока нет" /> : null}
            {users.map((row) => (
              <tr key={String(row.id)}>
                <td>{row.display_name}</td>
                <td>{row.email ?? '-'}</td>
                <td><Status value={row.role} /></td>
                <td>{row.rating ?? 0}</td>
                <td>{row.club_name ?? '-'}</td>
                <td>{row.wins ?? 0}/{row.losses ?? 0}</td>
                <td>
                  <form className="row-actions" action={updateUser}>
                    <HiddenId row={row} />
                    <select className="select" name="role" defaultValue={String(row.role)}>
                      {roles.map((role) => <option key={role}>{role}</option>)}
                    </select>
                    <input className="input" name="rating" type="number" defaultValue={String(row.rating ?? 0)} />
                    <button className="button secondary" type="submit">Сохранить</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
