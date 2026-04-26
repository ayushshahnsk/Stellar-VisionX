import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RunFusionPage from './pages/RunFusionPage';
import MetricsPage from './pages/MetricsPage';
import VisualizationPage from './pages/VisualizationPage';
import ReportsPage from './pages/ReportsPage';
import SystemStatusPage from './pages/SystemStatusPage';
import ActivityTimeline from './pages/ActivityTimeline';
import AlertsPage from './pages/AlertsPage';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="fusion" element={<RunFusionPage />} />
            <Route path="metrics" element={<MetricsPage />} />
            <Route path="visualization" element={<VisualizationPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="status" element={<SystemStatusPage />} />
            <Route path="timeline" element={<ActivityTimeline />} />
            <Route path="alerts" element={<AlertsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
