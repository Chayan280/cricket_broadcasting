export const scoreText = (inn) => (inn ? `${inn.runs}/${inn.wickets}` : '0/0');

export const ballsToOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

export const chaseText = (state) => {
  const c = state?.chase;
  if (!c) return '';
  if (state.phase === 'completed') return state.result || '';
  const team = state.innings[1]?.batting_team ?? state.innings[0]?.bowling_team;
  return `${team.short} need ${c.needed} from ${c.balls_left} balls`;
};

export const currentInnings = (state) => state?.innings[state.innings.length - 1];

export const inningsByNumber = (state, n) => state?.innings.find((i) => i.number === n);

export const WICKET_LABELS = {
  bowled: 'Bowled', caught: 'Caught', lbw: 'LBW', run_out: 'Run out', stumped: 'Stumped',
  hit_wicket: 'Hit wicket', obstructing: 'Obstructing field', retired_out: 'Retired out',
};
