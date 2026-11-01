import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { setOverlay } from '../../api/overlay';
import ChartPanel from '../../components/charts/ChartPanel';
import { CHARTS, chartById } from '../../components/charts/registry';
import ConnectionBadge from '../../components/common/ConnectionBadge';
import Loader from '../../components/common/Loader';
import useAnalytics from '../../hooks/useAnalytics';
import useLiveMatch from '../../hooks/useLiveMatch';

function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export default function ChartsStudioPage() {
  const { matchId } = useParams();
  const { state, overlay, connected } = useLiveMatch(matchId);
  const analytics = useAnalytics(matchId, state?.stamp);
  const [error, setError] = useState('');

  if (!state || !overlay) return <Loader />;
  const push = async (patch) => {
    try { setError(''); await setOverlay(matchId, { ...overlay, ...patch }); } catch (e) { setError(e.message); }
  };
  const chartId = overlay.chart || CHARTS[0].id;
  const def = chartById(chartId);
  const base = window.location.origin;

  return (
    <div className="studio">
      <aside className="studio-side">
        <h3>Charts</h3>
        {CHARTS.map((c) => (
          <button key={c.id} className={`chart-opt ${overlay.visible && overlay.chart === c.id ? 'live' : ''}`}
            onClick={() => push({ chart: c.id, visible: true })}>
            <strong>{c.title}</strong><span>{c.blurb}</span>
          </button>
        ))}
        <button className="btn danger" disabled={!overlay.visible} onClick={() => push({ visible: false })}>Hide from stream</button>
      </aside>
      <main className="studio-main">
        <div className="row wrap">
          <h2>{overlay.visible ? 'On air' : 'Off air'}: {def.title}</h2><span className="grow" />
          <ConnectionBadge connected={connected} />
        </div>
        <div className="row wrap">
          {def.scope === 'innings' && (
            <Seg label="Innings" value={overlay.innings} onChange={(v) => push({ innings: v })}
              options={[[0, 'Live innings'], [1, '1st innings'], [2, '2nd innings']]} />
          )}
          <Seg label="Position" value={overlay.position} onChange={(v) => push({ position: v })}
            options={[['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]} />
        </div>
        {error && <div className="error">{error}</div>}
        <div className={`preview-wrap ${overlay.visible ? '' : 'off'}`}>
          <ChartPanel chartId={chartId} innings={overlay.innings} analytics={analytics} state={state} />
        </div>
        <div className="panel">
          <h3>Stream links (add as browser sources)</h3>
          <p className="dim" style={{ margin: 0 }}>Chart overlay: <code>{base}/overlay/{matchId}</code></p>
          <p className="dim" style={{ margin: '0.25rem 0 0' }}>Scoreboard strip: <code>{base}/scoreboard/{matchId}?bg=transparent</code></p>
        </div>
      </main>
    </div>
  );
}
