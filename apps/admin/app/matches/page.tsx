import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Status, formatDate } from '../../components/ui';
import { createMatch, deleteMatch, updateMatch, updateRegistration } from '../../lib/actions';
import { apiList } from '../../lib/api';

const registrationStatuses = ['pending', 'confirmed', 'waitlist', 'cancelled', 'rejected'];
const matchStatuses = ['scheduled', 'live', 'completed', 'cancelled'];

export default async function MatchesPage() {
  const [tournaments, users, registrations, matches] = await Promise.all([
    apiList('/admin/tournaments'),
    apiList('/admin/users'),
    apiList('/admin/registrations'),
    apiList('/admin/matches'),
  ]);

  return (
    <AdminShell title="Матчи и заявки" subtitle="Подтверждение регистраций, посев, расписание матчей и результаты.">
      <section className="resource-layout">
        <form className="card form" action={createMatch}>
          <h2>Новый матч</h2>
          <label className="field">
            <span>Турнир</span>
            <select className="select" name="tournamentId" required>
              {tournaments.map((tournament) => <option value={String(tournament.id)} key={String(tournament.id)}>{tournament.title}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Игрок A</span>
            <select className="select" name="playerAId">
              <option value="">TBD</option>
              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Игрок B</span>
            <select className="select" name="playerBId">
              <option value="">TBD</option>
              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
            </select>
          </label>
          <label className="field"><span>Раунд</span><input className="input" name="roundName" defaultValue="Round 1" /></label>
          <label className="field"><span>Время</span><input className="input" name="scheduledAt" type="datetime-local" /></label>
          <button className="button" type="submit">Создать матч</button>
        </form>

        <section className="card">
          <h2>Регистрации</h2>
          <table className="table">
            <thead><tr><th>Турнир</th><th>Игрок</th><th>Рейтинг</th><th>Seed</th><th>Статус</th><th>Действия</th></tr></thead>
            <tbody>
              {registrations.length === 0 ? <EmptyRows label="Заявок пока нет" /> : null}
              {registrations.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.tournament_title}</td>
                  <td>{row.user_name}</td>
                  <td>{row.rating ?? 0}</td>
                  <td>{row.seed_number ?? '-'}</td>
                  <td><Status value={row.status} /></td>
                  <td>
                    <form className="row-actions" action={updateRegistration}>
                      <HiddenId row={row} />
                      <input className="input" name="seedNumber" type="number" defaultValue={String(row.seed_number ?? '')} />
                      <select className="select" name="status" defaultValue={String(row.status)}>
                        {registrationStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <button className="button secondary" type="submit">Сохранить</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section">Матчи</h2>
          <table className="table">
            <thead><tr><th>Турнир</th><th>Раунд</th><th>Игроки</th><th>Счет</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {matches.length === 0 ? <EmptyRows label="Матчей пока нет" /> : null}
              {matches.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.tournament_title ?? '-'}</td>
                  <td>{row.round_name ?? '-'}</td>
                  <td>{row.player_a_name ?? 'TBD'} vs {row.player_b_name ?? 'TBD'}</td>
                  <td>{row.score ?? '-'}</td>
                  <td><Status value={row.status} /></td>
                  <td>{formatDate(row.scheduled_at)}</td>
                  <td>
                    <div className="row-actions">
                      <form className="row-actions" action={updateMatch}>
                        <HiddenId row={row} />
                        <input className="input" name="score" defaultValue={String(row.score ?? '')} placeholder="5:3" />
                        <select className="select" name="status" defaultValue={String(row.status)}>
                          {matchStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <button className="button secondary" type="submit">Сохранить</button>
                      </form>
                      <form action={deleteMatch}>
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
