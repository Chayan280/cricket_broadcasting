import { api } from './client';

const admin = (path, method, body) => api(path, { method, body, role: 'admin' });

export const addBall = (matchId, innings, body) => admin(`/matches/${matchId}/innings/${innings}/balls`, 'POST', body);
export const undoLast = (matchId) => admin(`/matches/${matchId}/balls/last`, 'DELETE');
export const updateBall = (id, body) => admin(`/balls/${id}`, 'PUT', body);
export const deleteBall = (id) => admin(`/balls/${id}`, 'DELETE');
export const startSecondInnings = (matchId) => admin(`/matches/${matchId}/innings/2/start`, 'POST');
export const setInningsClosed = (matchId, n, closed) => admin(`/matches/${matchId}/innings/${n}`, 'PATCH', { closed });
export const addPlayer = (matchId, side, name) => admin(`/matches/${matchId}/players`, 'POST', { side, name });
export const renamePlayer = (id, name) => admin(`/players/${id}`, 'PATCH', { name });
