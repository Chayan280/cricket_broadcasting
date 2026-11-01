import { api } from './client';

export const login = (role, pin) => api('/auth/login', { method: 'POST', body: { role, pin } });
export const listMatches = () => api('/matches');
export const getState = (id) => api(`/matches/${id}/state`);
export const createMatch = (body) => api('/matches', { method: 'POST', body, role: 'admin' });
export const deleteMatch = (id) => api(`/matches/${id}`, { method: 'DELETE', role: 'admin' });
