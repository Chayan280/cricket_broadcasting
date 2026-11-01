import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMatches } from '../api/matches';
import Loader from '../components/common/Loader';

export default function HomePage() {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { listMatches().then(setMatches).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <header className="top-bar"><span className="brand"><i /> Cricket Live</span></header>
      <main className="page">
        <div className="row"><h1>Matches</h1><span className="grow" /><Link className="btn primary" to="/admin">Scorer login</Link></div>
        {error && <div className="error">Cannot reach the server: {error}</div>}
        {!matches && !error && <Loader />}
        {matches?.length === 0 && <p className="dim">No match yet. Log in as scorer and create one.</p>}
        <div className="home-grid">
          {matches?.map((m) => (
            <article key={m.id} className="panel match-card">
              <h3>{m.teams.A.name} vs {m.teams.B.name}</h3>
              <div className="dim">{m.title} · {m.overs} overs{m.venue ? ` · ${m.venue}` : ''}</div>
              <div className="num" style={{ fontSize: '1.3rem', marginTop: '0.4rem' }}>{m.score_line || 'Not started'}</div>
              <div className="links">
                <Link to={`/admin/matches/${m.id}`}>Scoring</Link>
                <Link to={`/scoreboard/${m.id}`}>Scoreboard</Link>
                <Link to={`/scoreboard/${m.id}?view=full`}>Full card</Link>
                <Link to={`/charts/${m.id}`}>Charts studio</Link>
                <Link to={`/overlay/${m.id}`}>Chart overlay</Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
