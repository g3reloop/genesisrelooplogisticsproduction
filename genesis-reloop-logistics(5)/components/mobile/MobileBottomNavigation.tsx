import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MobileBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Home',
      active: location.pathname === '/dashboard'
    },
    {
      path: '/jobs',
      icon: '📋',
      label: 'Jobs',
      active: location.pathname === '/jobs'
    },
    {
      path: '/active-job',
      icon: '🚛',
      label: 'Active',
      active: location.pathname === '/active-job'
    },
    {
      path: '/earnings',
      icon: '💰',
      label: 'Earnings',
      active: location.pathname === '/earnings'
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Profile',
      active: location.pathname === '/profile'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              item.active
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNavigation;
