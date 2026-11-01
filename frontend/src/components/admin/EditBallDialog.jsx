import { useState } from 'react';
import { updateBall } from '../../api/scoring';
import { WICKET_LABELS } from '../../utils/format';
import Modal from '../common/Modal';

export default function EditBallDialog({ ball, state, innings, onClose, onSaved }) {
  const batters = state.players[innings.batting_side];
  const bowlers = state.players[innings.bowling_side];
  const [f, setF] = useState({
    striker_id: ball.striker_id, non_striker_id: ball.non_striker_id, bowler_id: ball.bowler_id,
    runs_bat: ball.runs_bat, extra_type: ball.extra_type, extra_runs: ball.extra_runs,
    is_wicket: ball.is_wicket, wicket_type: ball.wicket_type || 'bowled',
    player_out_id: ball.player_out_id || ball.striker_id, fielder: ball.fielder || '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const num = (k) => (e) => set(k, Number(e.target.value));

  const save = async () => {
    try {
      await updateBall(ball.id, { ...f, fielder: f.fielder.trim() || null });
      onSaved();
    } catch (e) { setError(e.message); }
  };

  const sel = (k, list, label) => (
    <label className="field">{label}
      <select value={f[k]} onChange={num(k)}>{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    </label>
  );

  return (
    <Modal title={`Edit ball ${ball.over_label}`} onClose={onClose}
      actions={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Save changes</button></>}>
      <div className="form-grid">
        {sel('striker_id', batters, 'Striker')}
        {sel('non_striker_id', batters, 'Non-striker')}
        {sel('bowler_id', bowlers, 'Bowler')}
        <label className="field">Delivery type
          <select value={f.extra_type} onChange={(e) => set('extra_type', e.target.value)}>
            {['none', 'wide', 'noball', 'bye', 'legbye'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">Runs off the bat
          <input type="number" min="0" max="7" value={f.runs_bat} onChange={num('runs_bat')} />
        </label>
        <label className="field">Extra runs (wide / no-ball include the 1 penalty)
          <input type="number" min="0" max="12" value={f.extra_runs} onChange={num('extra_runs')} />
        </label>
        <label className="field span2" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={f.is_wicket} onChange={(e) => set('is_wicket', e.target.checked)} />
          Wicket on this ball
        </label>
        {f.is_wicket && <>
          <label className="field">How out
            <select value={f.wicket_type} onChange={(e) => set('wicket_type', e.target.value)}>
              {Object.entries(WICKET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {sel('player_out_id', batters, 'Batter out')}
          <label className="field span2">Fielder
            <input value={f.fielder} onChange={(e) => set('fielder', e.target.value)} />
          </label>
        </>}
      </div>
      {error && <div className="error" style={{ marginTop: '0.75rem' }}>{error}</div>}
    </Modal>
  );
}
