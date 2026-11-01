import HBarChart from './HBarChart';

export default function BowlerChart({ analytics, innings }) {
  const data = (analytics.bowlers[innings] || []).map((b) => ({
    name: b.name, economy: b.economy, label: `${b.wickets}/${b.runs} (${b.overs})  Econ ${b.economy.toFixed(1)}`, wickets: b.wickets,
  }));
  return <HBarChart data={data} valueKey="economy" color={(d) => (d.wickets > 0 ? '#e5384c' : '#35c0e8')} />;
}
