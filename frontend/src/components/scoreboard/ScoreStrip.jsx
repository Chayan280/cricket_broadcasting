import BallChip from '../common/BallChip';
import { chaseText, currentInnings } from '../../utils/format';

export default function ScoreStrip({ state }) {
  const inn = currentInnings(state);
  const batters = inn.batters.filter((b) => b.at_crease).sort((a, b) => Number(b.on_strike) - Number(a.on_strike));
  const bowlerId = inn.next.bowler_id ?? inn.last_over_bowler_id;
  const bowler = inn.bowlers.find((b) => b.id === bowlerId);
  const chase = chaseText(state);

  return (
    <div className="strip">
      <div className="strip-score">
        <span className="team">{inn.batting_team.short}</span>
        <span className="runs num">{inn.runs}-{inn.wickets}</span>
        <span className="ov num">{inn.overs}<small> / {state.match.overs}</small></span>
      </div>
      <div className="strip-mid">
        {batters.length === 0 && <span className="dim">Waiting for batters…</span>}
        {batters.map((b) => (
          <div key={b.id} className={`bat-line ${b.on_strike ? 'on' : ''}`}>
            <span><i className="mark">{b.on_strike ? '●' : ''}</i>{b.name}</span>
            <span className="num">{b.runs}<span className="sub">({b.balls})</span></span>
          </div>
        ))}
      </div>
      <div className="strip-bowl">
        {bowler && (
          <div className="bowl-line">
            <span>{bowler.name}</span>
            <span className="num">{bowler.wickets}-{bowler.runs} <span className="dim">({bowler.overs})</span></span>
          </div>
        )}
        <div className="over-chips">
          {inn.free_hit && <span className="fh">FREE HIT</span>}
          {inn.this_over.map((b, i) => <BallChip key={i} {...b} />)}
          {inn.this_over.length > 0 && <span className="num dim" style={{ marginLeft: '0.4rem' }}>{inn.this_over_runs} runs</span>}
        </div>
      </div>
      <div className="strip-foot">
        <span>CRR <b>{inn.crr.toFixed(2)}</b></span>
        {state.chase && state.phase !== 'completed' && <span>RRR <b>{state.chase.rrr?.toFixed(2) ?? '-'}</b></span>}
        {!state.chase && inn.projected && <span>Projected <b>{inn.projected}</b></span>}
        <span>Extras <b>{inn.extras.total}</b></span>
        {state.phase === 'innings_break' && <span className="chase">Innings break · Target {state.target}</span>}
        {chase && state.phase !== 'innings_break' && <span className="chase">{chase}</span>}
      </div>
    </div>
  );
}
