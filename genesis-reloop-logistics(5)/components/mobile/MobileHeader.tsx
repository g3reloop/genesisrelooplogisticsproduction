import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  rightAction
}) => {
  const { user } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {user && (
            <p className="text-sm text-gray-600">
              Welcome back, {user.name?.split(' ')[0] || 'User'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {rightAction}
        
        {/* Notification Bell */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a6 6 0 00-12 0v3l-5 5h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification Badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.name?.charAt(0) || 'U'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
