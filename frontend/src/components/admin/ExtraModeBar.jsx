const MODES = [
  ['none', 'Normal'], ['wide', 'Wide'], ['noball', 'No ball'], ['bye', 'Bye'], ['legbye', 'Leg bye'],
];

export default function ExtraModeBar({ mode, onChange }) {
  return (
    <div className="mode-bar" role="group" aria-label="Delivery type">
      {MODES.map(([id, label]) => (
        <button key={id} type="button" className={`btn small ${mode === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
