import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INNINGS_COLORS } from '../../utils/constants';
import { AXIS, Empty, GRID, LEGEND, TOOLTIP } from './chartTheme';

export default function RunRateChart({ analytics }) {
  const data = analytics.runrate;
  if (!data.length) return <Empty />;
  const teams = analytics.meta.teams;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="over" {...AXIS} />
        <YAxis domain={[0, 'auto']} {...AXIS} />
        <Tooltip {...TOOLTIP} formatter={(v) => (v == null ? '-' : v.toFixed(2))} labelFormatter={(o) => `After over ${o}`} />
        <Legend {...LEGEND} />
        {['1', '2'].filter((k) => teams[k]).map((k) => (
          <Line key={k} dataKey={`crr${k}`} name={`${teams[k].short} run rate`} stroke={INNINGS_COLORS[k]} strokeWidth={4}
            dot={{ r: 3 }} connectNulls isAnimationActive={false} />
        ))}
        {analytics.meta.target && (
          <Line dataKey="rrr" name="Required rate" stroke="#e5384c" strokeWidth={3} strokeDasharray="8 6" dot={false}
            connectNulls isAnimationActive={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
