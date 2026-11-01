export const AXIS = { stroke: '#93aec4', tick: { fill: '#93aec4', fontSize: 15, fontFamily: 'Barlow Condensed' } };
export const GRID = { stroke: '#25557f', strokeDasharray: '3 5', vertical: false };
export const TOOLTIP = {
  contentStyle: { background: '#071626', border: '1px solid #25557f', borderRadius: 6, color: '#ebf3f9' },
  labelStyle: { color: '#93aec4' },
  cursor: { fill: 'rgba(255,255,255,0.05)' },
};
export const LEGEND = { wrapperStyle: { fontFamily: 'Barlow Condensed', fontSize: 16, color: '#ebf3f9' } };
export const overTicks = (n) => Array.from({ length: Math.floor(n / (n > 20 ? 5 : 1)) + 1 }, (_, i) => i * (n > 20 ? 5 : 1));

export const Empty = ({ text = 'No balls bowled yet' }) => <div className="chart-empty">{text}</div>;
