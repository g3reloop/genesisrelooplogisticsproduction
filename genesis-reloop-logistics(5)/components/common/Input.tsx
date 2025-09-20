import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 sm:text-sm ${className}`}
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)', 
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--primary)'
          } as React.CSSProperties}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;