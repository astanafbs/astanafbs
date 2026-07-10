import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { TournamentBracket } from '../../components/tournament-bracket';
import { EmptyRows, HiddenId, Status, formatDate, toDateTimeInput } from '../../components/ui';
import { createMatch, deleteMatch, generateTournamentBracket, updateMatch, updateRegistration } from '../../lib/actions';
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
  const confirmedByTournament = new Map<string, number>();
  registrations.forEach((registration) => {
    if (registration.status !== 'confirmed') return;
    const id = String(registration.tournament_id);
    confirmedByTournament.set(id, (confirmedByTournament.get(id) ?? 0) + 1);
  });

  return (
    <AdminShell
      title="Матчи и заявки"
      subtitle="Подтверждение регистраций, посев, расписание матчей и результаты."
      action={
        <CreateModal buttonLabel="Создать матч" title="Новый матч">
          <form className="form" action={createMatch}>
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
            <label className="field"><span>Номер раунда</span><input className="input" name="roundNumber" type="number" min="1" defaultValue="1" /></label>
            <label className="field"><span>Позиция в сетке</span><input className="input" name="bracketPosition" type="number" min="1" defaultValue="1" /></label>
            <label className="field"><span>Стол</span><input className="input" name="tableNumber" type="number" min="1" /></label>
            <label className="field"><span>Время</span><input className="input" name="scheduledAt" type="datetime-local" /></label>
            <button className="button" type="submit">Создать матч</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
          <h2>Визуальная сетка</h2>
          <div className="admin-bracket-list">
            {tournaments.map((tournament) => {
              const tournamentMatches = matches.filter((match) => String(match.tournament_id) === String(tournament.id));
              if (!tournamentMatches.length) return null;
              return (
                <div className="admin-bracket-item" key={String(tournament.id)}>
                  <h3>{tournament.title}</h3>
                  <TournamentBracket matches={tournamentMatches} tournamentFormat={String(tournament.tournament_format ?? '')} />
                </div>
              );
            })}
            {!matches.length ? <p className="table-note">Сначала сгенерируйте сетку по подтвержденным заявкам.</p> : null}
          </div>

          <h2>Генерация сетки</h2>
          <table className="table">
            <thead><tr><th>Турнир</th><th>Подтверждено</th><th>Матчи</th><th>Действия</th></tr></thead>
            <tbody>
              {tournaments.length === 0 ? <EmptyRows label="Турниров пока нет" /> : null}
              {tournaments.map((tournament) => {
                const tournamentId = String(tournament.id);
                const tournamentMatches = matches.filter((match) => String(match.tournament_id) === tournamentId);
                const locked = tournamentMatches.some((match) => match.status === 'live' || (match.status === 'completed' && match.score !== 'BYE'));
                const confirmedCount = confirmedByTournament.get(tournamentId) ?? 0;
                return (
                  <tr key={tournamentId}>
                    <td>{tournament.title}</td>
                    <td>{confirmedCount}</td>
                    <td>{tournamentMatches.length}</td>
                    <td>
                      <ConfirmModal
                        buttonLabel={`Сгенерировать сетку ${tournament.title}`}
                        title="Сгенерировать сетку?"
                        message={locked ? 'В турнире уже есть live/completed матчи. Сначала проверьте результаты.' : 'Будут пересозданы запланированные матчи турнира по подтвержденным заявкам и seed.'}
                        buttonIcon="publish"
                        danger={false}
                      >
                        <form action={generateTournamentBracket}>
                          <HiddenId row={tournament} />
                          <button className="button" type="submit" disabled={locked || confirmedCount < 2}>Сгенерировать</button>
                        </form>
                      </ConfirmModal>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="section">Регистрации</h2>
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
                    <CreateModal buttonIcon="edit" buttonLabel={`Редактировать заявку ${row.user_name}`} title={`Редактировать заявку: ${row.user_name}`}>
                      <form className="form" action={updateRegistration}>
                        <HiddenId row={row} />
                        <label className="field"><span>Seed</span><input className="input" name="seedNumber" type="number" defaultValue={String(row.seed_number ?? '')} /></label>
                        <label className="field">
                          <span>Статус</span>
                          <select className="select" name="status" defaultValue={String(row.status)}>
                            {registrationStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <button className="button" type="submit">Сохранить</button>
                      </form>
                    </CreateModal>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section">Матчи</h2>
          <table className="table">
            <thead><tr><th>Турнир</th><th>Раунд</th><th>Стол</th><th>Игроки</th><th>Счет</th><th>Победитель</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {matches.length === 0 ? <EmptyRows label="Матчей пока нет" /> : null}
              {matches.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.tournament_title ?? '-'}</td>
                  <td>{row.round_name ?? '-'}</td>
                  <td>{row.table_number ?? '-'}</td>
                  <td>{row.player_a_name ?? 'TBD'} vs {row.player_b_name ?? 'TBD'}</td>
                  <td>{row.score ?? '-'}</td>
                  <td>{row.winner_name ?? '-'}</td>
                  <td><Status value={row.status} /></td>
                  <td>{formatDate(row.scheduled_at)}</td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать матч ${row.tournament_title ?? ''}`} title={`Редактировать матч: ${row.tournament_title ?? 'матч'}`}>
                        <form className="form" action={updateMatch}>
                          <HiddenId row={row} />
                          <label className="field"><span>Раунд</span><input className="input" name="roundName" defaultValue={String(row.round_name ?? '')} /></label>
                          <label className="field"><span>Стол</span><input className="input" name="tableNumber" type="number" min="1" defaultValue={String(row.table_number ?? '')} /></label>
                          <label className="field">
                            <span>Игрок A</span>
                            <select className="select" name="playerAId" defaultValue={String(row.player_a_id ?? '')}>
                              <option value="">TBD A</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Игрок B</span>
                            <select className="select" name="playerBId" defaultValue={String(row.player_b_id ?? '')}>
                              <option value="">TBD B</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field"><span>Счет</span><input className="input" name="score" defaultValue={String(row.score ?? '')} placeholder="5:3" /></label>
                          <label className="field">
                            <span>Победитель</span>
                            <select className="select" name="winnerId" defaultValue={String(row.winner_id ?? '')}>
                              <option value="">Не выбран</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {matchStatuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <label className="field"><span>Дата</span><input className="input" name="scheduledAt" type="datetime-local" defaultValue={toDateTimeInput(row.scheduled_at)} /></label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <ConfirmModal buttonLabel="Удалить матч" title="Удалить матч?" message="Матч будет удален из расписания. Действие нельзя отменить.">
                        <form action={deleteMatch}>
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
