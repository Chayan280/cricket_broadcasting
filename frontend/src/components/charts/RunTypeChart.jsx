import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Empty, LEGEND, TOOLTIP } from './chartTheme';

const COLORS = {
  Dots: '#5b7692', Singles: '#9ad8f0', Twos: '#35c0e8', Threes: '#2a8fb5', Fours: '#2da36b', Sixes: '#a259ff',
  'Byes / Leg byes': '#f0b429', 'Wides / No balls': '#c28f1d', Wickets: '#e5384c', Other: '#888',
};

export default function RunTypeChart({ analytics, innings }) {
  const data = analytics.runtypes[innings] || [];
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip {...TOOLTIP} />
        <Legend layout="vertical" align="right" verticalAlign="middle" {...LEGEND} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="82%" paddingAngle={2} stroke="none"
          isAnimationActive={false} label={({ value }) => value} labelLine={false}>
          {data.map((d) => <Cell key={d.name} fill={COLORS[d.name] || '#888'} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
