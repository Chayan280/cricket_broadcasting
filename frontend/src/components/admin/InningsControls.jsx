import { setInningsClosed, startSecondInnings } from '../../api/scoring';

export default function InningsControls({ state, innings, onChanged, onError }) {
  const act = async (fn) => { try { await fn(); onChanged(); } catch (e) { onError(e.message); } };
  return (
    <section className="panel">
      <h3>Innings</h3>
      <div className="pad-actions" style={{ marginTop: 0 }}>
        {state.phase === 'innings_break' && (
          <button className="btn primary" onClick={() => act(() => startSecondInnings(state.match.id))}>
            Start 2nd innings (target {state.target})
          </button>
        )}
        {!innings.closed && !innings.complete && (
          <button className="btn" onClick={() => window.confirm('End this innings now (declared / time up)?') && act(() => setInningsClosed(state.match.id, innings.number, true))}>
            End innings early
          </button>
        )}
        {innings.closed && (
          <button className="btn" onClick={() => act(() => setInningsClosed(state.match.id, innings.number, false))}>Reopen innings</button>
        )}
      </div>
      {innings.complete && <p className="dim">Innings ended: {innings.end_reason?.replace('_', ' ')}.</p>}
    </section>
  );
}
