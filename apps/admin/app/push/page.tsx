import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { EmptyRows, HiddenId, Status, formatDate } from '../../components/ui';
import { createPushCampaign, deletePushCampaign, updatePushCampaign } from '../../lib/actions';
import { apiList } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

export default async function PushPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params?.tab === 'devices' ? 'devices' : 'campaigns';
  const [tokens, campaigns] = await Promise.all([
    apiList('/admin/push-tokens'),
    apiList('/admin/push-campaigns'),
  ]);

  return (
    <AdminShell
      title="Push"
      subtitle="Токены устройств, кампании и ручная отправка уведомлений."
      action={activeTab === 'campaigns' ? (
        <CreateModal buttonLabel="Создать рассылку" title="Новая рассылка">
          <form className="form" action={createPushCampaign}>
            <label className="field"><span>Заголовок</span><input className="input" name="title" required /></label>
            <label className="field"><span>Текст</span><textarea className="textarea" name="body" required /></label>
            <label className="field"><span>Цель</span><input className="input" name="target" defaultValue="all" /></label>
            <label className="field"><span><input name="sendNow" type="checkbox" /> Отправить сразу</span></label>
            <button className="button" type="submit">Создать кампанию</button>
          </form>
        </CreateModal>
      ) : undefined}
    >
      <section className="card">
          <div className="tabs">
            <a className={activeTab === 'campaigns' ? 'active' : undefined} href="/push">Кампании</a>
            <a className={activeTab === 'devices' ? 'active' : undefined} href="/push?tab=devices">Устройства</a>
          </div>
        {activeTab === 'campaigns' ? (
          <>
          <h2>Кампании</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Статус</th><th>Цель</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {campaigns.length === 0 ? <EmptyRows label="Кампаний пока нет" /> : null}
              {campaigns.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td><Status value={row.status} /></td>
                  <td>{row.target}</td>
                  <td>{formatDate(row.sent_at ?? row.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <CreateModal buttonIcon="edit" buttonLabel={`Редактировать рассылку ${row.title}`} title={`Редактировать: ${row.title}`}>
                        <form className="form" action={updatePushCampaign}>
                          <HiddenId row={row} />
                          <label className="field"><span>Заголовок</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                          <label className="field"><span>Текст</span><textarea className="textarea" name="body" defaultValue={String(row.body ?? '')} required /></label>
                          <label className="field"><span>Цель</span><input className="input" name="target" defaultValue={String(row.target ?? 'all')} /></label>
                          <label className="field">
                            <span>Статус</span>
                            <select className="select" name="status" defaultValue={String(row.status)}>
                              {statuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          </label>
                          <button className="button" type="submit">Сохранить</button>
                        </form>
                      </CreateModal>
                      <ConfirmModal buttonLabel={`Удалить рассылку ${row.title}`} title="Удалить рассылку?" message="Кампания будет удалена из истории рассылок. Действие нельзя отменить.">
                        <form action={deletePushCampaign}>
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
          </>
        ) : (
          <>
          <h2>Устройства</h2>
          <table className="table">
            <thead><tr><th>Игрок</th><th>Платформа</th><th>Активен</th><th>Дата</th></tr></thead>
            <tbody>
              {tokens.length === 0 ? <EmptyRows label="Push tokens пока нет" /> : null}
              {tokens.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.display_name ?? row.email ?? '-'}</td>
                  <td>{row.platform ?? '-'}</td>
                  <td><Status value={row.enabled ? 'enabled' : 'disabled'} /></td>
                  <td>{formatDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </section>
    </AdminShell>
  );
}
