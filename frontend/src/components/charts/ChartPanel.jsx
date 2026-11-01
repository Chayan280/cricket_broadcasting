import { chartById } from './registry';

/** One framed chart. Used by both the commentator preview and the stream overlay. */
export default function ChartPanel({ chartId, innings, analytics, state }) {
  const def = chartById(chartId);
  if (!def || !analytics || !state) return null;
  const inn = innings || state.current_innings;
  const teams = analytics.meta.teams;
  const subtitle = def.scope === 'innings'
    ? `${teams[inn]?.name ?? ''} · Innings ${inn}`
    : `${state.match.teams.A.short} vs ${state.match.teams.B.short}`;
  const { Component } = def;
  return (
    <section className="chart-panel">
      <header><h2>{def.title}</h2><span className="dim">{subtitle}</span></header>
      <div className="chart-body"><Component analytics={analytics} innings={inn} /></div>
    </section>
  );
}
