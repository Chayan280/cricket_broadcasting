import { useEffect, useState } from 'react';
import { addBall, undoLast } from '../../api/scoring';
import ExtraModeBar from './ExtraModeBar';
import LineupPicker from './LineupPicker';
import RunKeys from './RunKeys';
import WicketDialog from './WicketDialog';

const ALL_WICKETS = ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'obstructing', 'retired_out'];

const ballFields = (mode, n) => ({
  none: { runs_bat: n, extra_type: 'none', extra_runs: 0 },
  wide: { runs_bat: 0, extra_type: 'wide', extra_runs: 1 + n },
  noball: { runs_bat: n, extra_type: 'noball', extra_runs: 1 },
  bye: { runs_bat: 0, extra_type: 'bye', extra_runs: n },
  legbye: { runs_bat: 0, extra_type: 'legbye', extra_runs: n },
})[mode];

export default function ScoringPad({ state, innings, onChanged }) {
  const matchId = state.match.id;
  const batters = state.players[innings.batting_side];
  const bowlers = state.players[innings.bowling_side];
  const [lineup, setLineup] = useState({ striker: '', nonStriker: '', bowler: '' });
  const [mode, setMode] = useState('none');
  const [wicketOpen, setWicketOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Whenever the ball log changes, reload the engine's suggestion for who is on strike / bowling next.
  const lastId = innings.balls[innings.balls.length - 1]?.id ?? 0;
  useEffect(() => {
    const n = innings.next;
    setLineup({ striker: n.striker_id ?? '', nonStriker: n.non_striker_id ?? '', bowler: n.bowler_id ?? '' });
    setMode('none');
  }, [innings.number, innings.balls.length, lastId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ready = lineup.striker !== '' && lineup.nonStriker !== '' && lineup.bowler !== '';
  const name = (id) => batters.find((p) => p.id === id)?.name ?? '';

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); onChanged(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const send = (runs, extra = {}) => run(() => addBall(matchId, innings.number, {
    striker_id: lineup.striker, non_striker_id: lineup.nonStriker, bowler_id: lineup.bowler,
    ...ballFields(mode, runs), ...extra,
  }));

  const allowed = innings.free_hit || mode === 'noball' ? ['run_out', 'obstructing']
    : mode === 'wide' ? ['stumped', 'run_out', 'hit_wicket', 'obstructing'] : ALL_WICKETS;

  if (innings.complete) {
    return (
      <div className="panel">
        <h3>Innings complete</h3>
        <p className="dim">Wrong last ball? Undo it to reopen the innings, or use the controls on the right.</p>
        {error && <div className="error">{error}</div>}
        <button className="btn danger" disabled={busy} onClick={() => run(() => undoLast(matchId))}>Undo last ball</button>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="row" style={{ marginBottom: '0.75rem' }}>
        <h3>Scoring</h3>
        {innings.free_hit && <span className="badge gold">FREE HIT</span>}
        {innings.needs_new_over && <span className="badge hot">Over complete: pick the next bowler</span>}
      </div>
      <LineupPicker batters={batters} bowlers={bowlers} outIds={innings.out_ids} lineup={lineup}
        onChange={setLineup} blockedBowlerId={innings.needs_new_over ? innings.last_over_bowler_id : null} />
      <div className="pad-actions" style={{ marginTop: '0.5rem' }}>
        <button className="btn small ghost" onClick={() => setLineup({ ...lineup, striker: lineup.nonStriker, nonStriker: lineup.striker })}>
          ⇄ Swap strike
        </button>
      </div>
      <ExtraModeBar mode={mode} onChange={setMode} />
      <RunKeys mode={mode} disabled={!ready || busy} onPick={send} onWicket={() => setWicketOpen(true)} />
      {!ready && <p className="dim">Select striker, non-striker and bowler to start scoring.</p>}
      {error && <div className="error" style={{ marginTop: '0.75rem' }}>{error}</div>}
      <div className="pad-actions">
        <button className="btn danger" disabled={busy || innings.balls.length === 0} onClick={() => run(() => undoLast(matchId))}>
          Undo last ball
        </button>
      </div>
      {wicketOpen && (
        <WicketDialog
          allowed={allowed}
          striker={{ id: lineup.striker, name: name(lineup.striker) }}
          nonStriker={{ id: lineup.nonStriker, name: name(lineup.nonStriker) }}
          onClose={() => setWicketOpen(false)}
          onConfirm={({ runs, ...w }) => { setWicketOpen(false); send(runs, { is_wicket: true, ...w }); }}
        />
      )}
    </section>
  );
}
