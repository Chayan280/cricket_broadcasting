import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { INNINGS_COLORS } from '../../utils/constants';
import { AXIS, Empty, GRID, LEGEND, TOOLTIP, overTicks } from './chartTheme';

export default function WormChart({ analytics }) {
  const { worm, meta } = analytics;
  const keys = ['1', '2'].filter((k) => worm[k] && worm[k].points.length > 1);
  if (!keys.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis type="number" dataKey="x" domain={[0, meta.overs]} ticks={overTicks(meta.overs)} {...AXIS} />
        <YAxis type="number" dataKey="y" {...AXIS} />
        <Tooltip {...TOOLTIP} formatter={(v) => [v, 'Runs']} labelFormatter={(x) => `${x} overs`} />
        <Legend {...LEGEND} />
        {keys.map((k) => (
          <Line key={k} data={worm[k].points} dataKey="y" name={worm[k].team} type="linear" stroke={INNINGS_COLORS[k]}
            strokeWidth={4} dot={false} isAnimationActive={false} />
        ))}
        {keys.flatMap((k) => worm[k].wickets.map((w, i) => (
          <ReferenceDot key={`${k}-${i}`} x={w.x} y={w.y} r={7} fill="#e5384c" stroke="#fff" strokeWidth={2} ifOverflow="visible" />
        )))}
      </LineChart>
    </ResponsiveContainer>
  );
}
