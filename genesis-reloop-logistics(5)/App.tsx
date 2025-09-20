
import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import EnhancedOnboardingPage from './pages/EnhancedOnboardingPage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ActiveJobPage from './pages/ActiveJobPage';
import EarningsPage from './pages/EarningsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import MobileJobsPage from './pages/MobileJobsPage';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </Router>
  );
};

const Main: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)'}}>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
                  <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/buyer" element={<BuyerDashboard />} />
                      <Route path="/jobs" element={<JobsPage />} />
                      <Route path="/mobile-jobs" element={<MobileJobsPage />} />
                      <Route path="/jobs/:id" element={<JobDetailsPage />} />
                      {/* Fix: Changed route from "/active-job/:id" to "/active-job" as the component uses context, not a URL parameter. */}
                      <Route path="/active-job" element={<ActiveJobPage />} />
                      <Route path="/earnings" element={<EarningsPage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                  </Route>

          <Route element={<OnboardingGuard/>}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

const OnboardingGuard: React.FC = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="text-center py-20">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // If onboarding is already complete, redirect to dashboard
    if (user.onboardingComplete) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <Outlet />;
};

export default App;