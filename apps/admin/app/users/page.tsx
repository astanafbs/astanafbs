import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { EmptyRows, HiddenId, Status, formatDate, toDateTimeInput } from '../../components/ui';
import { deleteUser, updateUser } from '../../lib/actions';
import { apiList } from '../../lib/api';

const roles = ['user', 'club_admin', 'superadmin'];

export default async function UsersPage() {
  const [users, clubs, profileStatuses] = await Promise.all([
    apiList('/admin/users'),
    apiList('/admin/clubs'),
    apiList('/admin/profile-statuses'),
  ]);

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
              <th>% побед</th>
              <th>Звания</th>
              <th>Статус</th>
              <th>Клуб</th>
              <th>Доступы</th>
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
                <td>{row.win_percentage ?? 0}%</td>
                <td>{Array.isArray(row.titles) ? row.titles.join(', ') : '-'}</td>
                <td>{row.profile_status_label ?? '-'}</td>
                <td>{row.club_admin_club_name ?? row.club_name ?? '-'}</td>
                <td>
                  <span className="table-note">
                    app: {formatDate(row.app_access_until)}<br />
                    stream: {formatDate(row.stream_watch_until)}<br />
                    ads: {formatDate(row.listing_publish_until)}
                  </span>
                </td>
                <td>{row.wins ?? 0}/{row.losses ?? 0}</td>
                <td>
                  <div className="row-actions">
                    <CreateModal buttonIcon="edit" buttonLabel={`Редактировать пользователя ${row.display_name}`} title={`Редактировать: ${row.display_name}`}>
                      <form className="form" action={updateUser}>
                        <HiddenId row={row} />
                        <label className="field"><span>Имя</span><input className="input" name="displayName" defaultValue={String(row.display_name)} required /></label>
                        <label className="field">
                          <span>Роль</span>
                          <select className="select" name="role" defaultValue={String(row.role)}>
                            {roles.map((role) => <option key={role}>{role}</option>)}
                          </select>
                        </label>
                        <label className="field"><span>Рейтинг</span><input className="input" name="rating" type="number" defaultValue={String(row.rating ?? 0)} /></label>
                        <label className="field"><span>Город</span><input className="input" name="city" defaultValue={String(row.city ?? '')} /></label>
                        <label className="field"><span>Клуб</span><input className="input" name="clubName" defaultValue={String(row.club_name ?? '')} /></label>
                        <label className="field">
                          <span>Статус профиля</span>
                          <select className="select" name="profileStatusId" defaultValue={String(row.profile_status_id ?? '')}>
                            <option value="">Не выбран</option>
                            {profileStatuses.map((status) => (
                              <option value={String(status.id)} key={String(status.id)}>{status.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Клуб для админа клуба</span>
                          <select className="select" name="clubAdminClubId" defaultValue={String(row.club_admin_club_id ?? '')}>
                            <option value="">Не выбран</option>
                            {clubs.map((club) => <option value={String(club.id)} key={String(club.id)}>{club.name}</option>)}
                          </select>
                        </label>
                        <label className="field"><span>Доступ к приложению до</span><input className="input" name="appAccessUntil" type="datetime-local" defaultValue={toDateTimeInput(row.app_access_until)} /></label>
                        <label className="field"><span>Трансляции до</span><input className="input" name="streamWatchUntil" type="datetime-local" defaultValue={toDateTimeInput(row.stream_watch_until)} /></label>
                        <label className="field"><span>Объявления до</span><input className="input" name="listingPublishUntil" type="datetime-local" defaultValue={toDateTimeInput(row.listing_publish_until)} /></label>
                        <label className="field"><span>Уровень</span><input className="input" name="skillLevel" defaultValue={String(row.skill_level ?? '')} /></label>
                        <label className="field"><span>Звания через запятую</span><input className="input" name="titles" defaultValue={Array.isArray(row.titles) ? row.titles.join(', ') : ''} /></label>
                        <label className="field"><span>Победы</span><input className="input" name="wins" type="number" defaultValue={String(row.wins ?? 0)} /></label>
                        <label className="field"><span>Поражения</span><input className="input" name="losses" type="number" defaultValue={String(row.losses ?? 0)} /></label>
                        <button className="button" type="submit">Сохранить</button>
                      </form>
                    </CreateModal>
                    <ConfirmModal buttonLabel={`Удалить пользователя ${row.display_name}`} title="Удалить пользователя?" message="Профиль игрока и связанные персональные данные будут удалены. Действие нельзя отменить.">
                      <form action={deleteUser}>
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
