import BatterChart from './BatterChart';
import BowlerChart from './BowlerChart';
import ManhattanChart from './ManhattanChart';
import PartnershipChart from './PartnershipChart';
import PhaseChart from './PhaseChart';
import RunRateChart from './RunRateChart';
import RunTypeChart from './RunTypeChart';
import WormChart from './WormChart';

/** scope 'match' = shows both innings; 'innings' = needs an innings number. Add new charts here only. */
export const CHARTS = [
  { id: 'worm', title: 'Worm', blurb: 'Cumulative runs, both innings', scope: 'match', Component: WormChart },
  { id: 'manhattan', title: 'Manhattan', blurb: 'Runs per over with wickets', scope: 'match', Component: ManhattanChart },
  { id: 'runrate', title: 'Run rate', blurb: 'Current vs required rate', scope: 'match', Component: RunRateChart },
  { id: 'phases', title: 'Match phases', blurb: 'Powerplay / middle / death', scope: 'match', Component: PhaseChart },
  { id: 'batters', title: 'Batters', blurb: 'Runs, balls and strike rate', scope: 'innings', Component: BatterChart },
  { id: 'bowlers', title: 'Bowlers', blurb: 'Figures and economy', scope: 'innings', Component: BowlerChart },
  { id: 'partnerships', title: 'Partnerships', blurb: 'Runs added for each wicket', scope: 'innings', Component: PartnershipChart },
  { id: 'runtypes', title: 'Scoring shots', blurb: 'Dots, singles, boundaries…', scope: 'innings', Component: RunTypeChart },
];

export const chartById = (id) => CHARTS.find((c) => c.id === id);
