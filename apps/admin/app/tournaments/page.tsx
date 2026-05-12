import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, HiddenId, Money, Status, formatDate, toDateTimeInput } from '../../components/ui';
import { createTournament, deleteTournament, updateTournament } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'];

export default async function TournamentsPage() {
  const [tournaments, clubs] = await Promise.all([
    apiList('/admin/tournaments'),
    apiList('/admin/clubs'),
  ]);

  return (
    <AdminShell title="Турниры" subtitle="Создание, публикация, регистрация, сетка и управление статусами.">
      <section className="resource-layout">
        <form className="card form" action={createTournament}>
          <h2>Новый турнир</h2>
          <Field name="title" label="Название" required />
          <Select name="status" label="Статус" values={statuses} />
          <Select name="clubId" label="Клуб" values={clubs.map((club) => [String(club.id), String(club.name)])} empty="Без клуба" />
          <Field name="startsAt" label="Начало" type="datetime-local" />
          <Field name="location" label="Адрес" />
          <Field name="entryFeeCents" label="Взнос, тиын" type="number" defaultValue="0" />
          <Field name="maxPlayers" label="Лимит игроков" type="number" />
          <button className="button" type="submit">Создать</button>
        </form>

        <section className="card">
          <h2>Список турниров</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Статус</th>
                <th>Клуб</th>
                <th>Дата</th>
                <th>Взнос</th>
                <th>Игроки</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length === 0 ? <EmptyRows label="Турниров пока нет" /> : null}
              {tournaments.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <form className="inline-form" action={updateTournament}>
                      <HiddenId row={row} />
                      <input className="input" name="title" defaultValue={String(row.title)} />
                      <button className="button secondary" type="submit">OK</button>
                    </form>
                  </td>
                  <td>
                    <form className="inline-form" action={updateTournament}>
                      <HiddenId row={row} />
                      <select className="select" name="status" defaultValue={String(row.status)}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <button className="button secondary" type="submit">OK</button>
                    </form>
                    <Status value={row.status} />
                  </td>
                  <td>{row.club_name ?? 'без клуба'}</td>
                  <td>
                    <form className="inline-form" action={updateTournament}>
                      <HiddenId row={row} />
                      <input className="input" name="startsAt" type="datetime-local" defaultValue={toDateTimeInput(row.starts_at)} />
                      <button className="button secondary" type="submit">OK</button>
                    </form>
                    {formatDate(row.starts_at)}
                  </td>
                  <td><Money value={row.entry_fee_cents} /></td>
                  <td>{String(row.registrations_count ?? 0)} / {String(row.max_players ?? '-')}</td>
                  <td>
                    <div className="row-actions">
                      <form action={updateTournament}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value="registration_open" />
                        <button className="button secondary" type="submit">Открыть</button>
                      </form>
                      <form action={deleteTournament}>
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

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return <label className="field"><span>{label}</span><input className="input" {...input} /></label>;
}

function Select({
  name,
  label,
  values,
  empty,
}: {
  name: string;
  label: string;
  values: Array<string | [string, string]>;
  empty?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="select" name={name}>
        {empty ? <option value="">{empty}</option> : null}
        {values.map((value) => {
          const [optionValue, optionLabel] = Array.isArray(value) ? value : [value, value];
          return <option value={optionValue} key={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}
