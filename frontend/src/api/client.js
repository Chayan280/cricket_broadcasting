import { API_BASE } from '../config/env';
import { getPin } from '../utils/pinStore';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, role } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (role) headers['X-Pin'] = getPin(role);
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch { /* not json */ }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}
