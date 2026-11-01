import { deleteBall } from '../../api/scoring';
import BallChip from '../common/BallChip';

export default function BallLog({ innings, onEdit, onChanged, onError }) {
  const remove = async (b) => {
    if (!window.confirm(`Delete ball ${b.over_label}? Everything after it will recalculate.`)) return;
    try { await deleteBall(b.id); onChanged(); } catch (e) { onError(e.message); }
  };
  const rows = [...innings.balls].reverse();
  return (
    <section className="panel">
      <h3>Ball by ball</h3>
      {rows.length === 0 && <p className="dim">No balls yet.</p>}
      <div className="log-scroll">
        <table className="log">
          <thead><tr><th>Ov</th><th>Bowler → Batter</th><th>Ball</th><th>Runs</th><th /></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="num">{b.over_label}</td>
                <td>{b.bowler} → {b.striker}{b.free_hit ? ' (FH)' : ''}</td>
                <td><BallChip label={b.label} kind={b.kind} /></td>
                <td className="num">{b.total}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn small" onClick={() => onEdit(b)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(b)} aria-label="Delete ball">✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
