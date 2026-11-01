import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteMatch, listMatches } from '../../api/matches';
import MatchCreateForm from '../../components/admin/MatchCreateForm';
import Loader from '../../components/common/Loader';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const load = useCallback(() => listMatches().then(setMatches), []);
  useEffect(() => { load(); }, [load]);

  const remove = async (m) => {
    if (!window.confirm(`Delete "${m.title}" and all its balls? This cannot be undone.`)) return;
    await deleteMatch(m.id);
    load();
  };

  return (
    <main className="page stack">
      <div className="row"><h1>Matches</h1><span className="grow" />
        <button className="btn primary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'New match'}</button>
      </div>
      {showForm && <MatchCreateForm onCreated={(id) => navigate(`/admin/matches/${id}`)} />}
      {!matches && <Loader />}
      <div className="home-grid">
        {matches?.map((m) => (
          <article key={m.id} className="panel match-card">
            <h3>{m.teams.A.name} vs {m.teams.B.name}</h3>
            <div className="dim">{m.title} · {m.overs} overs</div>
            <div className="num" style={{ fontSize: '1.25rem', margin: '0.4rem 0' }}>{m.score_line || 'Not started'}</div>
            <div className="row">
              <Link className="btn primary small" to={`/admin/matches/${m.id}`}>Open scoring</Link>
              <button className="btn small danger" onClick={() => remove(m)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
