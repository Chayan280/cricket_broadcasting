import { INNINGS_COLORS } from '../../utils/constants';
import HBarChart from './HBarChart';

export default function BatterChart({ analytics, innings }) {
  const data = (analytics.batters[innings] || []).map((b) => ({
    name: b.name, runs: b.runs, label: `${b.runs} (${b.balls})  SR ${b.sr.toFixed(0)}${b.out ? '' : ' *'}`, out: b.out,
  }));
  return <HBarChart data={data} valueKey="runs" color={() => INNINGS_COLORS[innings]} dim={(d) => d.out} />;
}
