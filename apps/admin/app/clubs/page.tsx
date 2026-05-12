import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId } from '../../components/ui';
import { createClub, deleteClub, updateClub } from '../../lib/actions';
import { apiList } from '../../lib/api';

export default async function ClubsPage() {
  const clubs = await apiList('/admin/clubs');

  return (
    <AdminShell title="Клубы" subtitle="Площадки, адреса, контакты и связь с турнирами.">
      <section className="resource-layout">
        <form className="card form" action={createClub}>
          <h2>Новый клуб</h2>
          <label className="field"><span>Название</span><input className="input" name="name" required /></label>
          <label className="field"><span>Адрес</span><input className="input" name="address" /></label>
          <label className="field"><span>Город</span><input className="input" name="city" defaultValue="Astana" /></label>
          <label className="field"><span>Телефон</span><input className="input" name="phone" /></label>
          <button className="button" type="submit">Создать</button>
        </form>

        <section className="card">
          <h2>Список клубов</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Адрес</th><th>Город</th><th>Телефон</th><th>Действия</th></tr></thead>
            <tbody>
              {clubs.length === 0 ? <EmptyRows label="Клубов пока нет" /> : null}
              {clubs.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.name}</td>
                  <td>{row.address}</td>
                  <td>{row.city}</td>
                  <td>{row.phone ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <form action={updateClub}>
                        <HiddenId row={row} />
                        <input type="hidden" name="name" value={String(row.name)} />
                        <input type="hidden" name="city" value="Astana" />
                        <button className="button secondary" type="submit">Обновить</button>
                      </form>
                      <form action={deleteClub}>
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
