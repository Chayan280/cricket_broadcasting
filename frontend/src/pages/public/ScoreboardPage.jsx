import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FullScorecard from '../../components/scoreboard/FullScorecard';
import ScoreStrip from '../../components/scoreboard/ScoreStrip';
import useLiveMatch from '../../hooks/useLiveMatch';

/**  /scoreboard/:id            -> bottom strip (default)
 *   /scoreboard/:id?view=full  -> full scorecard
 *   add &bg=transparent (OBS browser source) or &bg=green (chroma key)           */
export default function ScoreboardPage() {
  const { matchId } = useParams();
  const [params] = useSearchParams();
  const full = params.get('view') === 'full';
  const bg = params.get('bg');
  const { state, error } = useLiveMatch(matchId);

  useEffect(() => {
    const cls = bg === 'transparent' ? 'is-overlay' : bg === 'green' ? 'bg-green' : '';
    if (cls) document.body.classList.add(cls);
    return () => cls && document.body.classList.remove(cls);
  }, [bg]);

  if (!state) return <div className="loader">{error || 'Connecting…'}</div>;
  return (
    <div className={`sb-stage ${full ? 'full' : ''}`}>
      {full ? <FullScorecard state={state} /> : <ScoreStrip state={state} />}
    </div>
  );
}
