import { AdminShell } from '../../components/admin-shell';
import { EmptyRows, Status, formatDate } from '../../components/ui';
import { createPushCampaign } from '../../lib/actions';
import { apiList } from '../../lib/api';

export default async function PushPage() {
  const [tokens, campaigns] = await Promise.all([
    apiList('/admin/push-tokens'),
    apiList('/admin/push-campaigns'),
  ]);

  return (
    <AdminShell title="Push" subtitle="Токены устройств, кампании и ручная отправка уведомлений.">
      <section className="resource-layout">
        <form className="card form" action={createPushCampaign}>
          <h2>Новая рассылка</h2>
          <label className="field"><span>Заголовок</span><input className="input" name="title" required /></label>
          <label className="field"><span>Текст</span><textarea className="textarea" name="body" required /></label>
          <label className="field"><span>Цель</span><input className="input" name="target" defaultValue="all" /></label>
          <label className="field"><span><input name="sendNow" type="checkbox" /> Отправить сразу</span></label>
          <button className="button" type="submit">Создать кампанию</button>
        </form>

        <section className="card">
          <h2>Кампании</h2>
          <table className="table">
            <thead><tr><th>Название</th><th>Статус</th><th>Цель</th><th>Дата</th></tr></thead>
            <tbody>
              {campaigns.length === 0 ? <EmptyRows label="Кампаний пока нет" /> : null}
              {campaigns.map((row) => (
                <tr key={String(row.id)}>
                  <td>{row.title}</td>
                  <td><Status value={row.status} /></td>
                  <td>{row.target}</td>
                  <td>{formatDate(row.sent_at ?? row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section">Устройства</h2>
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
        </section>
      </section>
    </AdminShell>
  );
}
