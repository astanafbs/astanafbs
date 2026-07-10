import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { ImageField } from '../../components/file-field';
import { Icon } from '../../components/icons';
import { EmptyRows, HiddenId, ImagePreview } from '../../components/ui';
import { createClub, deleteClub, updateClub } from '../../lib/actions';
import { apiList } from '../../lib/api';

export default async function ClubsPage() {
  const clubs = await apiList('/admin/clubs');

  return (
    <AdminShell
      title="Клубы"
      subtitle="Площадки, адреса, контакты и связь с турнирами."
      action={
        <CreateModal buttonLabel="Создать клуб" title="Новый клуб">
          <form className="form" action={createClub}>
            <label className="field"><span>Название</span><input className="input" name="name" required /></label>
            <label className="field"><span>Адрес</span><input className="input" name="address" /></label>
            <label className="field"><span>Город</span><input className="input" name="city" defaultValue="Astana" /></label>
            <label className="field"><span>Телефон</span><input className="input" name="phone" /></label>
            <ImageField name="imageKey" label="Фото" />
            <label className="field"><span>2ГИС ссылка</span><input className="input" name="twoGisUrl" /></label>
            <button className="button" type="submit">Создать</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
          <h2>Список клубов</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Адрес</th><th>Город</th><th>Телефон</th><th>Фото</th><th>2ГИС</th><th>Действия</th></tr></thead>
            <tbody>
              {clubs.length === 0 ? <EmptyRows label="Клубов пока нет" /> : null}
              {clubs.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.name}</td>
                  <td>{row.address}</td>
                  <td>{row.city}</td>
                  <td>{row.phone ?? '-'}</td>
                  <td><ImagePreview value={row.image_key} label={String(row.name)} /></td>
                  <td>
                    {row.two_gis_url ? (
                      <a className="icon-button action-icon" href={String(row.two_gis_url)} target="_blank" aria-label="Открыть 2ГИС" title="Открыть 2ГИС">
                        <Icon name="external" />
                        <span className="sr-only">Открыть 2ГИС</span>
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать клуб ${row.name}`} title={`Редактировать: ${row.name}`}>
                        <form className="form" action={updateClub}>
                          <HiddenId row={row} />
                          <label className="field"><span>Название</span><input className="input" name="name" defaultValue={String(row.name)} required /></label>
                          <label className="field"><span>Адрес</span><input className="input" name="address" defaultValue={String(row.address ?? '')} /></label>
                          <label className="field"><span>Город</span><input className="input" name="city" defaultValue={String(row.city ?? '')} /></label>
                          <label className="field"><span>Телефон</span><input className="input" name="phone" defaultValue={String(row.phone ?? '')} /></label>
                          <ImageField name="imageKey" label="Фото" defaultValue={String(row.image_key ?? '')} />
                          <label className="field"><span>2ГИС ссылка</span><input className="input" name="twoGisUrl" defaultValue={String(row.two_gis_url ?? '')} /></label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <ConfirmModal buttonLabel={`Удалить клуб ${row.name}`} title="Удалить клуб?" message="Клуб будет удален из списка площадок. Действие нельзя отменить.">
                        <form action={deleteClub}>
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
