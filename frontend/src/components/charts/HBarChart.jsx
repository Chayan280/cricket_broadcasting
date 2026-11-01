import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, Empty, TOOLTIP } from './chartTheme';

const endLabel = ({ x, y, width, height, value }) => (
  <text x={x + width + 10} y={y + height / 2} dy="0.35em" fill="#ebf3f9" fontSize={18} fontFamily="Barlow Condensed">{value}</text>
);

/** Shared horizontal bar chart used by batters / bowlers / partnerships. */
export default function HBarChart({ data, valueKey, color, nameWidth = 150, dim = () => false }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 4, bottom: 0 }} barCategoryGap="22%">
                <XAxis type="number" hide domain={[0, (max) => Math.ceil(max * 1.7) + 4]} />
        <YAxis type="category" dataKey="name" width={nameWidth} {...AXIS} tick={{ ...AXIS.tick, fill: '#ebf3f9', fontSize: 17 }} />
        <Tooltip {...TOOLTIP} />
        <Bar dataKey={valueKey} isAnimationActive={false} radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={dim(d) ? '#5b7692' : color(d)} />)}
          <LabelList dataKey="label" content={endLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
