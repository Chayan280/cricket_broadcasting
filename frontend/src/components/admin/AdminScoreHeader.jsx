import { chaseText } from '../../utils/format';
import ConnectionBadge from '../common/ConnectionBadge';

export default function AdminScoreHeader({ state, innings, connected }) {
  const maxOvers = state.match.overs;
  return (
    <section className="panel">
      <div className="row wrap">
        <span className="dim">{state.match.title}</span>
        <span className="badge">Innings {innings.number}</span>
        <span className="grow" />
        <ConnectionBadge connected={connected} />
      </div>
      <div className="score-head">
        <span className="team">{innings.batting_team.name}</span>
        <span className="big">{innings.runs}/{innings.wickets}</span>
        <span className="num" style={{ fontSize: '1.6rem' }}>{innings.overs} <span className="dim">/ {maxOvers} ov</span></span>
        <span className="dim">CRR {innings.crr.toFixed(2)}{innings.projected ? ` · Projected ${innings.projected}` : ''}</span>
      </div>
      {state.chase && state.phase !== 'completed' && <p className="num" style={{ fontSize: '1.3rem', color: 'var(--gold)', margin: '0.4rem 0 0' }}>
        Target {state.chase.target} · {chaseText(state)}
      </p>}
      {state.result && <p className="badge gold" style={{ display: 'inline-block', marginTop: '0.5rem' }}>{state.result}</p>}
    </section>
  );
}
