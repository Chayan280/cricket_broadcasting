import { api } from './client';

export const getAnalytics = (matchId) => api(`/matches/${matchId}/analytics`);
