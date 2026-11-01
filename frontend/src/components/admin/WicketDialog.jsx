import { useState } from 'react';
import Modal from '../common/Modal';
import { WICKET_LABELS } from '../../utils/format';

export default function WicketDialog({ allowed, striker, nonStriker, onClose, onConfirm }) {
  const [type, setType] = useState(allowed[0]);
  const [outId, setOutId] = useState(striker.id);
  const [fielder, setFielder] = useState('');
  const [runs, setRuns] = useState(0);
  const strikerOnly = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'].includes(type);
  const out = strikerOnly ? striker.id : outId;
  const needsFielder = ['caught', 'stumped', 'run_out'].includes(type);

  return (
    <Modal
      title="Wicket"
      onClose={onClose}
      actions={<>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onConfirm({ wicket_type: type, player_out_id: out, fielder: needsFielder ? fielder.trim() || null : null, runs })}>
          Confirm wicket
        </button>
      </>}
    >
      <div className="form-grid">
        <label className="field">How out
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {allowed.map((t) => <option key={t} value={t}>{WICKET_LABELS[t]}</option>)}
          </select>
        </label>
        <label className="field">Batter out
          <select value={out} disabled={strikerOnly} onChange={(e) => setOutId(Number(e.target.value))}>
            <option value={striker.id}>{striker.name} (striker)</option>
            <option value={nonStriker.id}>{nonStriker.name} (non-striker)</option>
          </select>
        </label>
        {needsFielder && (
          <label className="field">{type === 'stumped' ? 'Keeper' : 'Fielder'} (optional)
            <input value={fielder} onChange={(e) => setFielder(e.target.value)} />
          </label>
        )}
        {type === 'run_out' && (
          <label className="field">Runs completed
            <select value={runs} onChange={(e) => setRuns(Number(e.target.value))}>
              {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="dim">After confirming, pick the new batter in the lineup box.</p>
    </Modal>
  );
}
