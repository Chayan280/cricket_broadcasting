import { Route, Routes } from 'react-router-dom';
import PinGate from '../components/common/PinGate';
import AdminLayout from '../layouts/AdminLayout';
import BareLayout from '../layouts/BareLayout';
import AdminMatchesPage from '../pages/admin/AdminMatchesPage';
import AdminScoringPage from '../pages/admin/AdminScoringPage';
import ChartOverlayPage from '../pages/charts/ChartOverlayPage';
import ChartsStudioPage from '../pages/charts/ChartsStudioPage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import ScoreboardPage from '../pages/public/ScoreboardPage';

const admin = (el) => <PinGate role="admin" title="Scorer access">{el}</PinGate>;
const commentator = (el) => <PinGate role="commentator" title="Commentator access">{el}</PinGate>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={admin(<AdminMatchesPage />)} />
        <Route path="matches/:matchId" element={admin(<AdminScoringPage />)} />
      </Route>
      <Route path="/charts/:matchId" element={<AdminLayout role="commentator" label="Commentator" />}>
        <Route index element={commentator(<ChartsStudioPage />)} />
      </Route>
      <Route element={<BareLayout />}>
        <Route path="/scoreboard/:matchId" element={<ScoreboardPage />} />
        <Route path="/overlay/:matchId" element={<ChartOverlayPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
