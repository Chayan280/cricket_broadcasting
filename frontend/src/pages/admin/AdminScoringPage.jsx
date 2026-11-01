import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminScoreHeader from '../../components/admin/AdminScoreHeader';
import BallLog from '../../components/admin/BallLog';
import EditBallDialog from '../../components/admin/EditBallDialog';
import InningsControls from '../../components/admin/InningsControls';
import ScoringPad from '../../components/admin/ScoringPad';
import SquadEditor from '../../components/admin/SquadEditor';
import Loader from '../../components/common/Loader';
import useLiveMatch from '../../hooks/useLiveMatch';
import { currentInnings } from '../../utils/format';

export default function AdminScoringPage() {
  const { matchId } = useParams();
  const { state, connected, error: loadError, refresh } = useLiveMatch(matchId);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  if (loadError && !state) return <div className="page"><div className="error">{loadError}</div></div>;
  if (!state) return <Loader />;
  const innings = currentInnings(state);
  const changed = () => { setError(''); refresh(); };

  return (
    <main className="page stack">
      <div className="row wrap">
        <Link to="/admin">← Matches</Link><span className="grow" />
        <Link to={`/scoreboard/${matchId}`} target="_blank">Open scoreboard</Link>
        <Link to={`/charts/${matchId}`} target="_blank">Charts studio</Link>
      </div>
      <AdminScoreHeader state={state} innings={innings} connected={connected} />
      {error && <div className="error">{error}</div>}
      <div className="admin-grid">
        <div className="stack">
          <ScoringPad state={state} innings={innings} onChanged={changed} />
          <BallLog innings={innings} onEdit={setEditing} onChanged={changed} onError={setError} />
        </div>
        <div className="stack">
          <InningsControls state={state} innings={innings} onChanged={changed} onError={setError} />
          <SquadEditor state={state} onChanged={changed} onError={setError} />
        </div>
      </div>
      {editing && (
        <EditBallDialog ball={editing} state={state} innings={innings} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); changed(); }} />
      )}
    </main>
  );
}
