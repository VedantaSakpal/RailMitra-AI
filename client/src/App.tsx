import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store/appStore';

// Pages
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Layouts & Guards
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import TrainSearchPage from './pages/search/TrainSearchPage';
import LiveTrackingPage from './pages/tracking/LiveTrackingPage';
import LiveStationBoardPage from './pages/tracking/LiveStationBoardPage';
import TrainRouteMapPage from './pages/tracking/TrainRouteMapPage';
import TicketsPage from './pages/tickets/TicketsPage';
import PassesPage from './pages/passes/PassesPage';
import AIAssistantPage from './pages/ai/AIAssistantPage';
import ProfilePage from './pages/profile/ProfilePage';

export default function App() {
  const { theme, setTheme } = useAppStore();

  // Apply theme on mount
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/search" element={<TrainSearchPage />} />
            <Route path="/tracking" element={<LiveTrackingPage />} />
            <Route path="/station-board" element={<LiveStationBoardPage />} />
            <Route path="/route-map" element={<TrainRouteMapPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/passes" element={<PassesPage />} />
            <Route path="/ai" element={<AIAssistantPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Redirect /dashboard shortcut for unauthenticated users */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
