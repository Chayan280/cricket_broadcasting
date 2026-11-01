function BattingTable({ inn, players }) {
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
  return (
    <table className="sc-table">
      <thead><tr><th>Batter</th><th /><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
      <tbody>
        {inn.batters.map((b) => (
          <tr key={b.id} className={b.at_crease ? 'live' : ''}>
            <td>{b.name}{b.on_strike ? ' ●' : ''}</td>
            <td className="out">{b.out ? b.dismissal : b.at_crease ? 'not out' : ''}</td>
            <td><b>{b.runs}</b></td><td>{b.balls}</td><td>{b.fours}</td><td>{b.sixes}</td><td>{b.sr.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan="2">Extras (w {inn.extras.wide}, nb {inn.extras.noball}, b {inn.extras.bye}, lb {inn.extras.legbye})</td><td colSpan="5"><b>{inn.extras.total}</b></td></tr>
        {inn.yet_to_bat.length > 0 && <tr><td colSpan="7" className="out">Yet to bat: {inn.yet_to_bat.map((id) => names[id]).join(', ')}</td></tr>}
      </tfoot>
    </table>
  );
}

function BowlingTable({ inn }) {
  return (
    <table className="sc-table">
      <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
      <tbody>
        {inn.bowlers.map((b) => (
          <tr key={b.id}><td>{b.name}</td><td>{b.overs}</td><td>{b.maidens}</td><td>{b.runs}</td><td><b>{b.wickets}</b></td><td>{b.economy.toFixed(2)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FullScorecard({ state }) {
  return (
    <div className="card-grid">
      {state.innings.map((inn) => (
        <section key={inn.number} className="panel">
          <div className="card-head">
            <h2>{inn.batting_team.name}</h2>
            <span className="score">{inn.runs}/{inn.wickets} <small className="dim">({inn.overs} ov)</small></span>
          </div>
          <BattingTable inn={inn} players={state.players[inn.batting_side]} />
          <BowlingTable inn={inn} />
          {inn.fow.length > 0 && (
            <p className="sc-note">Fall of wickets: {inn.fow.map((f) => `${f.runs}-${f.wicket} (${f.player}, ${f.over})`).join(', ')}</p>
          )}
        </section>
      ))}
      {state.result && <h2 style={{ gridColumn: '1 / -1', color: 'var(--gold)' }}>{state.result}</h2>}
    </div>
  );
}
