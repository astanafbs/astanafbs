import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { ImageField } from '../../components/file-field';
import { IconButton } from '../../components/icons';
import { EmptyRows, HiddenId, Money, Status, formatDate, toDateTimeInput, toTengeInput } from '../../components/ui';
import { createTournament, deleteTournament, updateTournament } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'];
const disciplines = ['Москва', 'Комби', 'Америка', 'Длинная америка', 'Невка', 'Колхоз'];
const bracketSizes: Array<[string, string]> = [['16', '16 игроков'], ['32', '32 игрока'], ['64', '64 игрока']];
const tournamentFormats: Array<[string, string]> = [
  ['single_elimination', 'Олимпийская сетка'],
  ['double_elimination', 'Double elimination'],
  ['round_robin', 'Круговая лига'],
  ['group_playoff', 'Группы + плей-офф'],
  ['swiss', 'Швейцарка'],
];

function tournamentFormatLabel(value?: unknown) {
  return tournamentFormats.find(([key]) => key === value)?.[1] ?? String(value ?? '-');
}

export default async function TournamentsPage() {
  const [tournaments, clubs, users] = await Promise.all([
    apiList('/admin/tournaments'),
    apiList('/admin/clubs'),
    apiList('/admin/users'),
  ]);

  return (
    <AdminShell
      title="Турниры"
      subtitle="Создание, публикация, регистрация, сетка и управление статусами."
      action={
        <CreateModal buttonLabel="Создать турнир" title="Новый турнир">
          <form className="form" action={createTournament}>
            <Field name="title" label="Название" required />
            <Select name="status" label="Статус" values={statuses} />
            <Select name="clubId" label="Клуб" values={clubs.map((club) => [String(club.id), String(club.name)])} empty="Без клуба" />
            <Select name="discipline" label="Дисциплина" values={disciplines} />
            <Select name="tournamentFormat" label="Формат" values={tournamentFormats} />
            <Field name="startsAt" label="Начало" type="datetime-local" />
            <Field name="location" label="Адрес" />
            <Field name="entryFeeCents" label="Взнос, ₸" type="number" defaultValue="0" />
            <Select name="maxPlayers" label="Размер сетки" values={bracketSizes} />
            <ImageField name="bannerKey" label="Баннер" />
            <Select name="firstPlaceUserId" label="1 место" values={users.map((user) => [String(user.id), String(user.display_name)])} empty="Не выбрано" />
            <Select name="secondPlaceUserId" label="2 место" values={users.map((user) => [String(user.id), String(user.display_name)])} empty="Не выбрано" />
            <Select name="thirdPlaceUserId" label="3 место" values={users.map((user) => [String(user.id), String(user.display_name)])} empty="Не выбрано" />
            <Select name="thirdPlaceSecondUserId" label="3 место" values={users.map((user) => [String(user.id), String(user.display_name)])} empty="Не выбрано" />
            <button className="button" type="submit">Создать</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
          <h2>Список турниров</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Статус</th>
                <th>Дисциплина</th>
                <th>Формат</th>
                <th>Клуб</th>
                <th>Дата</th>
                <th>Взнос</th>
                <th>Игроки</th>
                <th>Итоги</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length === 0 ? <EmptyRows label="Турниров пока нет" /> : null}
              {tournaments.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td><Status value={row.status} /></td>
                  <td>{row.discipline ?? '-'}</td>
                  <td>{tournamentFormatLabel(row.tournament_format)}</td>
                  <td>{row.club_name ?? 'без клуба'}</td>
                  <td>{formatDate(row.starts_at)}</td>
                  <td><Money value={row.entry_fee_cents} /></td>
                  <td>{String(row.registrations_count ?? 0)} / {String(row.max_players ?? '-')}</td>
                  <td>
                    <span className="table-note">
                      {row.first_place_user_id ? 'заполнены' : 'не заполнены'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать турнир ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updateTournament}>
                          <HiddenId row={row} />
                          <Field name="title" label="Название" defaultValue={String(row.title)} required />
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Клуб</span>
                            <select className="select" name="clubId" defaultValue={String(row.club_id ?? '')}>
                              <option value="">Без клуба</option>
                              {clubs.map((club) => <option value={String(club.id)} key={String(club.id)}>{club.name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Дисциплина</span>
                            <select className="select" name="discipline" defaultValue={String(row.discipline ?? 'Москва')}>
                              {disciplines.map((discipline) => <option key={discipline}>{discipline}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Формат</span>
                            <select className="select" name="tournamentFormat" defaultValue={String(row.tournament_format ?? 'single_elimination')}>
                              {tournamentFormats.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </label>
                          <Field name="startsAt" label="Начало" type="datetime-local" defaultValue={toDateTimeInput(row.starts_at)} />
                          <Field name="endsAt" label="Окончание" type="datetime-local" defaultValue={toDateTimeInput(row.ends_at)} />
                          <Field name="location" label="Адрес" defaultValue={String(row.location ?? '')} />
                          <Field name="entryFeeCents" label="Взнос, ₸" type="number" defaultValue={toTengeInput(row.entry_fee_cents)} />
                          <label className="field">
                            <span>Размер сетки</span>
                            <select className="select" name="maxPlayers" defaultValue={String(row.max_players ?? 16)}>
                              {bracketSizes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </label>
                          <ImageField name="bannerKey" label="Баннер" defaultValue={String(row.banner_key ?? '')} />
                          <label className="field">
                            <span>1 место</span>
                            <select className="select" name="firstPlaceUserId" defaultValue={String(row.first_place_user_id ?? '')}>
                              <option value="">Не выбрано</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>2 место</span>
                            <select className="select" name="secondPlaceUserId" defaultValue={String(row.second_place_user_id ?? '')}>
                              <option value="">Не выбрано</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>3 место</span>
                            <select className="select" name="thirdPlaceUserId" defaultValue={String(row.third_place_user_id ?? '')}>
                              <option value="">Не выбрано</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <label className="field">
                            <span>Доп. 3 место</span>
                            <select className="select" name="thirdPlaceSecondUserId" defaultValue={String(row.third_place_second_user_id ?? '')}>
                              <option value="">Не выбрано</option>
                              {users.map((user) => <option value={String(user.id)} key={String(user.id)}>{user.display_name}</option>)}
                            </select>
                          </label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <form action={updateTournament}>
                        <HiddenId row={row} />
                        <input type="hidden" name="status" value="registration_open" />
                        <IconButton icon="open" label="Открыть регистрацию" tone="success" type="submit" />
                      </form>
                      <ConfirmModal buttonLabel={`Удалить турнир ${row.title}`} title="Удалить турнир?" message="Турнир, заявки и связанные данные будут удалены. Действие нельзя отменить.">
                        <form action={deleteTournament}>
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
