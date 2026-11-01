import { Link, Outlet } from 'react-router-dom';
import { clearPin } from '../utils/pinStore';

export default function AdminLayout({ role = 'admin', label = 'Scorer' }) {
  return (
    <>
      <header className="top-bar">
        <Link to="/" className="brand"><i /> Cricket Live</Link>
        <span className="badge">{label}</span>
        <span className="grow" />
        <button className="btn small ghost" onClick={() => { clearPin(role); window.location.reload(); }}>Lock</button>
      </header>
      <Outlet />
    </>
  );
}
