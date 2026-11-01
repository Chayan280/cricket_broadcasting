import { api } from './client';

export const getOverlay = (matchId) => api(`/matches/${matchId}/overlay`);
export const setOverlay = (matchId, body) => api(`/matches/${matchId}/overlay`, { method: 'POST', body, role: 'commentator' });
