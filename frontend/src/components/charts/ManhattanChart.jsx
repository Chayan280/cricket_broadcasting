import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INNINGS_COLORS } from '../../utils/constants';
import { AXIS, Empty, GRID, LEGEND, TOOLTIP } from './chartTheme';

// A bar with one red dot stacked above it per wicket in that over.
const WicketBar = ({ x, y, width, height, fill, payload, wk }) => (
  <g>
    <rect x={x} y={y} width={width} height={Math.max(height, 0)} fill={fill} rx={2} />
    {Array.from({ length: payload[wk] || 0 }).map((_, i) => (
      <circle key={i} cx={x + width / 2} cy={y - 10 - i * 16} r={7} fill="#e5384c" stroke="#fff" strokeWidth={1.5} />
    ))}
  </g>
);

export default function ManhattanChart({ analytics }) {
  const data = analytics.manhattan;
  if (!data.length) return <Empty />;
  const teams = analytics.meta.teams;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="over" {...AXIS} />
        <YAxis domain={[0, (max) => max + 4]} allowDecimals={false} {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Legend {...LEGEND} />
        {['1', '2'].filter((k) => teams[k]).map((k) => (
          <Bar key={k} dataKey={`inn${k}`} name={teams[k].short} fill={INNINGS_COLORS[k]} isAnimationActive={false}
            shape={(p) => <WicketBar {...p} wk={`w${k}`} />} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
