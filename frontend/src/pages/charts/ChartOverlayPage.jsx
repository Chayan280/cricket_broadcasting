import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChartPanel from '../../components/charts/ChartPanel';
import useAnalytics from '../../hooks/useAnalytics';
import useLiveMatch from '../../hooks/useLiveMatch';

/** Transparent page for OBS / vMix browser source. The commentator decides what shows here. */
export default function ChartOverlayPage() {
  const { matchId } = useParams();
  const { state, overlay } = useLiveMatch(matchId);
  const analytics = useAnalytics(matchId, state?.stamp);

  useEffect(() => {
    document.body.classList.add('is-overlay');
    return () => document.body.classList.remove('is-overlay');
  }, []);

  if (!overlay) return null;
  return (
    <div className={`overlay-stage pos-${overlay.position}`}>
      {overlay.visible && overlay.chart && (
        <ChartPanel key={`${overlay.chart}-${overlay.innings}`} chartId={overlay.chart} innings={overlay.innings}
          analytics={analytics} state={state} />
      )}
    </div>
  );
}
