import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="dim">That link does not exist. <Link to="/">Back to matches</Link></p>
    </div>
  );
}
