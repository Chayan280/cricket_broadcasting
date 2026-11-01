export default function ConnectionBadge({ connected }) {
  return <span className={`conn ${connected ? 'on' : ''}`}>{connected ? 'Live' : 'Reconnecting…'}</span>;
}
