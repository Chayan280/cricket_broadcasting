export default function LineupPicker({ batters, bowlers, outIds, lineup, onChange, blockedBowlerId }) {
  const set = (key, v) => onChange({ ...lineup, [key]: v === '' ? '' : Number(v) });
  const options = (other) => batters.filter((p) => !outIds.includes(p.id) && p.id !== other);
  return (
    <div className="lineup">
      <label className="field">Striker ●
        <select value={lineup.striker} onChange={(e) => set('striker', e.target.value)}>
          <option value="">Select batter</option>
          {options(lineup.nonStriker).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="field">Non-striker
        <select value={lineup.nonStriker} onChange={(e) => set('nonStriker', e.target.value)}>
          <option value="">Select batter</option>
          {options(lineup.striker).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="field">Bowler
        <select value={lineup.bowler} onChange={(e) => set('bowler', e.target.value)}>
          <option value="">Select bowler</option>
          {bowlers.map((p) => (
            <option key={p.id} value={p.id} disabled={p.id === blockedBowlerId}>
              {p.name}{p.id === blockedBowlerId ? ' (bowled last over)' : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
