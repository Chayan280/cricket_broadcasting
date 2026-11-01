const raw = import.meta.env.VITE_API_URL;

// Unset -> same machine that served the page, port 8000 (works for every laptop on the LAN).
export const API_BASE =
  raw !== undefined ? raw.replace(/\/$/, '') : `http://${window.location.hostname}:8000`;

export const wsUrl = (path) => (API_BASE || window.location.origin).replace(/^http/, 'ws') + path;
