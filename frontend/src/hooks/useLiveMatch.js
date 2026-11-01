import { useCallback, useEffect, useState } from 'react';
import { getOverlay } from '../api/overlay';
import { getState } from '../api/matches';
import { wsUrl } from '../config/env';

/** Loads match state + overlay once, then keeps both live over a WebSocket (auto-reconnect). */
export default function useLiveMatch(matchId) {
  const [state, setState] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([getState(matchId), getOverlay(matchId)]);
      setState(s);
      setOverlay(o);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [matchId]);

  useEffect(() => {
    refresh();
    let ws, retry, ping;
    let closed = false;
    const connect = () => {
      ws = new WebSocket(wsUrl(`/ws/matches/${matchId}`));
      ws.onopen = () => {
        setConnected(true);
        refresh(); // catch anything missed while offline
        ping = setInterval(() => ws.readyState === 1 && ws.send('ping'), 20000);
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'state') setState(msg.data);
        if (msg.type === 'overlay') setOverlay(msg.data);
      };
      ws.onclose = () => {
        setConnected(false);
        clearInterval(ping);
        if (!closed) retry = setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      ws && ws.close();
    };
  }, [matchId, refresh]);

  return { state, overlay, connected, error, refresh };
}
