import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import SupplierDashboard from '../components/supplier/SupplierDashboard';
import DriverDashboard from '../components/driver/DriverDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-center py-20">Loading dashboard...</div>;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.SUPPLIER:
        return <SupplierDashboard />;
      case UserRole.DRIVER:
        return <DriverDashboard />;
      case UserRole.BUYER:
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-bold">Buyer Dashboard</h1>
                <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                    Welcome, {user.name}. Your buyer dashboard is coming soon.
                </p>
            </div>
        );
      default:
        return <div className="text-center py-20">Invalid user role.</div>;
    }
  };

  return (
    <div>
      {renderDashboard()}
    </div>
  );
};

export default DashboardPage;
