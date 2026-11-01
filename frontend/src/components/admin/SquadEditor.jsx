import { useState } from 'react';
import { addPlayer, renamePlayer } from '../../api/scoring';

function Side({ side, label, players, onChanged, onError }) {
  const [name, setName] = useState('');
  const rename = async (p, value) => {
    if (!value.trim() || value.trim() === p.name) return;
    try { await renamePlayer(p.id, value); onChanged(); } catch (e) { onError(e.message); }
  };
  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try { await addPlayer(side.matchId, side.key, name); setName(''); onChanged(); } catch (err) { onError(err.message); }
  };
  return (
    <div>
      <h3>{label}</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}><input defaultValue={p.name} onBlur={(e) => rename(p, e.target.value)} aria-label={`Rename ${p.name}`} /></li>
        ))}
      </ul>
      <form className="row" style={{ marginTop: '0.5rem' }} onSubmit={add}>
        <input placeholder="Add player" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn small">Add</button>
      </form>
    </div>
  );
}

export default function SquadEditor({ state, onChanged, onError }) {
  const m = state.match;
  return (
    <section className="panel">
      <h3>Squads</h3>
      <div className="squads">
        {['A', 'B'].map((k) => (
          <Side key={k} side={{ key: k, matchId: m.id }} label={m.teams[k].name} players={state.players[k]} onChanged={onChanged} onError={onError} />
        ))}
      </div>
    </section>
  );
}
