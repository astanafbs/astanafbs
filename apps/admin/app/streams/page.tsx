import { AdminShell } from '../../components/admin-shell';
import { ConfirmModal, CreateModal } from '../../components/create-modal';
import { EmptyRows, HiddenId, Status, formatDate, toDateTimeInput } from '../../components/ui';
import { createStream, deleteStream, updateStream } from '../../lib/actions';
import { apiList, Row } from '../../lib/api';

const statuses = ['draft', 'published', 'archived'];

function matchLabel(match: Row) {
  const players = `${match.player_a_name ?? 'TBD'} vs ${match.player_b_name ?? 'TBD'}`;
  const round = match.round_name ? `${match.round_name}` : `Раунд ${match.round_number ?? '-'}`;
  return `${match.tournament_title ?? 'Турнир'} · ${round} · ${players}`;
}

function streamMatchLabel(stream: Row) {
  if (!stream.match_id) return 'Не привязана';
  const players = `${stream.player_a_name ?? 'TBD'} vs ${stream.player_b_name ?? 'TBD'}`;
  return `${stream.tournament_title ?? 'Турнир'} · ${stream.round_name ?? 'Матч'} · ${players}`;
}

function MatchSelect({
  matches,
  currentStreamId,
  defaultValue,
}: {
  matches: Row[];
  currentStreamId?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field">
      <span>Матч</span>
      <select className="select" name="matchId" defaultValue={defaultValue ?? ''}>
        <option value="">Без привязки к матчу</option>
        {matches.map((match) => {
          const streamId = match.stream_id ? String(match.stream_id) : '';
          const assignedToAnotherStream = Boolean(streamId && streamId !== currentStreamId);
          return (
            <option
              value={String(match.id)}
              key={String(match.id)}
              disabled={assignedToAnotherStream}
            >
              {matchLabel(match)}{assignedToAnotherStream ? ' · уже есть эфир' : ''}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default async function StreamsPage() {
  const [streams, matches] = await Promise.all([
    apiList('/admin/streams'),
    apiList('/admin/matches'),
  ]);

  return (
    <AdminShell
      title="Трансляции"
      subtitle="YouTube Live эфиров матчей: Video ID, публикация и привязка к сетке."
      action={
        <CreateModal buttonLabel="Создать эфир" title="Новая трансляция">
          <form className="form" action={createStream}>
            <label className="field"><span>Название</span><input className="input" name="title" required placeholder="Финал Astana Open" /></label>
            <label className="field"><span>YouTube Video ID</span><input className="input" name="youtubeVideoId" placeholder="abc123XYZ" /></label>
            <MatchSelect matches={matches} />
            <label className="field"><span>Начало</span><input className="input" name="startsAt" type="datetime-local" /></label>
            <label className="field">
              <span>Статус</span>
              <select className="select" name="status" defaultValue="draft">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <button className="button" type="submit">Создать эфир</button>
          </form>
        </CreateModal>
      }
    >
      <section className="card">
        <h2>Эфиры матчей</h2>
        <table className="table">
          <thead><tr><th>Эфир</th><th>Матч</th><th>Video ID</th><th>Статус</th><th>Начало</th><th>Действия</th></tr></thead>
          <tbody>
            {streams.length === 0 ? <EmptyRows label="Трансляций пока нет" /> : null}
            {streams.map((row) => (
              <tr key={String(row.id)}>
                <td>
                  <strong>{row.title}</strong>
                  <p className="table-note">{row.id}</p>
                </td>
                <td>{streamMatchLabel(row)}</td>
                <td>{row.youtube_video_id ? <code>{String(row.youtube_video_id)}</code> : '-'}</td>
                <td><Status value={row.status} /></td>
                <td>{formatDate(row.starts_at)}</td>
                <td>
                  <div className="row-actions">
                    <CreateModal buttonIcon="edit" buttonLabel={`Редактировать эфир ${row.title}`} title={`Редактировать эфир: ${row.title}`}>
                      <form className="form" action={updateStream}>
                        <HiddenId row={row} />
                        <label className="field"><span>Название</span><input className="input" name="title" defaultValue={String(row.title)} required /></label>
                        <label className="field"><span>YouTube Video ID</span><input className="input" name="youtubeVideoId" defaultValue={String(row.youtube_video_id ?? '')} placeholder="abc123XYZ" /></label>
                        <MatchSelect matches={matches} currentStreamId={String(row.id)} defaultValue={String(row.match_id ?? '')} />
                        <label className="field"><span>Начало</span><input className="input" name="startsAt" type="datetime-local" defaultValue={toDateTimeInput(row.starts_at)} /></label>
                        <label className="field">
                          <span>Статус</span>
                          <select className="select" name="status" defaultValue={String(row.status)}>
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <button className="button" type="submit">Сохранить</button>
                      </form>
                    </CreateModal>
                    <form action={updateStream}>
                      <HiddenId row={row} />
                      <input type="hidden" name="title" value={String(row.title)} />
                      <input type="hidden" name="youtubeVideoId" value={String(row.youtube_video_id ?? '')} />
                      <input type="hidden" name="matchId" value={String(row.match_id ?? '')} />
                      <input type="hidden" name="startsAt" value={toDateTimeInput(row.starts_at)} />
                      <input type="hidden" name="status" value={row.status === 'published' ? 'draft' : 'published'} />
                      <button className="button secondary" type="submit">
                        {row.status === 'published' ? 'В черновик' : 'Опубликовать'}
                      </button>
                    </form>
                    <ConfirmModal buttonLabel={`Удалить эфир ${row.title}`} title="Удалить трансляцию?" message="Эфир пропадет из приложения. YouTube Live на стороне YouTube не удаляется.">
                      <form action={deleteStream}>
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
