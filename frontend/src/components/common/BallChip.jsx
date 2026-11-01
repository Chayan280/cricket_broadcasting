export default function BallChip({ label, kind }) {
  return <span className={`chip ${kind}`}>{label}</span>;
}
