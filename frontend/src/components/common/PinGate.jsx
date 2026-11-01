import { useEffect, useState } from 'react';
import { login } from '../../api/matches';
import { clearPin, getPin, setPin } from '../../utils/pinStore';
import Loader from './Loader';

/** Asks for the role PIN once per browser; re-asks if the server PIN was changed. */
export default function PinGate({ role, title, children }) {
  const [status, setStatus] = useState(getPin(role) ? 'checking' : 'ask');
  const [pin, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'checking') return;
    login(role, getPin(role)).then(() => setStatus('ok')).catch(() => { clearPin(role); setStatus('ask'); });
  }, [role, status]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(role, pin);
      setPin(role, pin);
      setStatus('ok');
    } catch {
      setError('Wrong PIN. Try again.');
    }
  };

  if (status === 'checking') return <Loader text="Checking access…" />;
  if (status === 'ok') return children;
  return (
    <form className="pin-gate panel" onSubmit={submit}>
      <h2>{title}</h2>
      <label className="field">PIN
        <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setValue(e.target.value)} />
      </label>
      {error && <div className="error">{error}</div>}
      <button className="btn primary" type="submit">Unlock</button>
    </form>
  );
}
