import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/analytics';

/** Re-fetches chart data whenever the live match state changes (stamp changes on every push). */
export default function useAnalytics(matchId, stamp) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    getAnalytics(matchId).then((d) => alive && setData(d)).catch(() => {});
    return () => { alive = false; };
  }, [matchId, stamp]);
  return data;
}
