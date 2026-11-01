import { Bar, BarChart, CartesianGrid, Legend, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INNINGS_COLORS } from '../../utils/constants';
import { AXIS, Empty, GRID, LEGEND, TOOLTIP } from './chartTheme';

export default function PhaseChart({ analytics }) {
  const teams = analytics.meta.teams;
  const data = analytics.phases.map((p) => ({ ...p, label: `${p.phase} (${p.range})` }));
  if (!data.some((p) => p.inn1 || p.inn2)) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Legend {...LEGEND} />
        {['1', '2'].filter((k) => teams[k]).map((k) => (
          <Bar key={k} dataKey={`inn${k}`} name={`${teams[k].short} runs`} fill={INNINGS_COLORS[k]} isAnimationActive={false}>
            <LabelList dataKey={`inn${k}`} position="top" fill="#ebf3f9" fontSize={18} fontFamily="Barlow Condensed" />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
