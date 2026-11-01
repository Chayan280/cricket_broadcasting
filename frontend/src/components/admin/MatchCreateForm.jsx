import { useState } from 'react';
import { createMatch } from '../../api/matches';

const sample = (t) => Array.from({ length: 11 }, (_, i) => `${t} Player ${i + 1}`).join('\n');
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export default function MatchCreateForm({ onCreated }) {
  const [f, setF] = useState({
    title: 'Match 1', venue: '', team_a_name: 'Team A', team_a_short: 'TMA', team_b_name: 'Team B',
    team_b_short: 'TMB', overs: 20, players_per_side: 11, batting_first: 'A',
    a_players: sample('A'), b_players: sample('B'),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { a_players, b_players, ...rest } = f;
      const res = await createMatch({ ...rest, overs: Number(f.overs), players_per_side: Number(f.players_per_side),
        team_a_players: lines(a_players), team_b_players: lines(b_players) });
      onCreated(res.id);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const In = (k, label, props = {}) => <label className="field">{label}<input value={f[k]} onChange={set(k)} {...props} /></label>;

  return (
    <form className="panel stack" onSubmit={submit}>
      <h3>New match</h3>
      <div className="form-grid">
        {In('title', 'Match title', {required: true})}
        {In('venue', 'Venue')}
        {In('team_a_name', 'Team A name', {required: true})}
        {In('team_a_short', 'Team A short (max 6)', {maxLength: 6, required: true})}
        {In('team_b_name', 'Team B name', {required: true})}
        {In('team_b_short', 'Team B short (max 6)', {maxLength: 6, required: true})}
        {In('overs', 'Overs per innings', {type: 'number', min: '1', max: '50'})}
        {In('players_per_side', 'Players per side', {type: 'number', min: '2', max: '11'})}
        <label className="field">Batting first
          <select value={f.batting_first} onChange={set('batting_first')}>
            <option value="A">{f.team_a_name || 'Team A'}</option>
            <option value="B">{f.team_b_name || 'Team B'}</option>
          </select>
        </label>
        <span />
        <label className="field">Team A players (batting order, one per line)
          <textarea value={f.a_players} onChange={set('a_players')} />
        </label>
        <label className="field">Team B players (batting order, one per line)
          <textarea value={f.b_players} onChange={set('b_players')} />
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn primary" disabled={busy}>Create match</button>
    </form>
  );
}
