import HBarChart from './HBarChart';

export default function PartnershipChart({ analytics, innings }) {
  const data = (analytics.partnerships[innings] || []).map((p) => ({
    name: p.pair, runs: p.runs, label: `${p.runs} (${p.balls})${p.active ? ' *' : ''}`, active: !!p.active,
  }));
  return <HBarChart data={data} valueKey="runs" nameWidth={230} color={(d) => (d.active ? '#f0b429' : '#2da36b')} />;
}
