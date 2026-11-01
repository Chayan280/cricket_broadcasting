const PREFIX = { none: '', wide: 'Wd', noball: 'Nb', bye: 'B', legbye: 'Lb' };

const keyLabel = (mode, n) => {
  if (mode === 'none') return String(n);
  if (mode === 'wide' || mode === 'noball') return n === 0 ? PREFIX[mode] : `${PREFIX[mode]}+${n}`;
  return `${PREFIX[mode]}${n}`;
};

export default function RunKeys({ mode, disabled, onPick, onWicket }) {
  return (
    <div className="run-keys">
      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
        <button
          key={n}
          className={`btn ${(mode === 'none' || mode === 'noball') && n === 4 ? 'four' : ''} ${(mode === 'none' || mode === 'noball') && n === 6 ? 'six' : ''}`}
          disabled={disabled || ((mode === 'bye' || mode === 'legbye') && n === 0) || (mode === 'wide' && n > 4)}
          onClick={() => onPick(n)}
        >
          {keyLabel(mode, n)}
        </button>
      ))}
      <button className="btn wicket" disabled={disabled} onClick={onWicket}>Wicket</button>
    </div>
  );
}
