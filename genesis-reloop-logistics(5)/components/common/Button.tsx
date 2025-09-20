import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
};

type ButtonAsButton = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  to?: undefined;
};

type ButtonAsLink = BaseProps & Omit<LinkProps, 'className'> & {
  to: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-3 text-lg',
  };

  const variantStyles = {
    primary: { 
      backgroundColor: 'var(--primary)', 
      color: '#0A0F0D', // Dark text on bright button
      borderColor: 'var(--primary)',
      '--tw-ring-color': 'var(--primary)',
    },
    secondary: { 
      backgroundColor: 'var(--card-bg)', 
      color: 'var(--text-primary)',
      borderColor: 'var(--border-color)',
      '--tw-ring-color': 'var(--primary)',
    },
  };

  const combinedClasses = `${baseClasses} ${sizeStyles[size]} ${className}`;

  if (props.to) {
    return (
      <Link {...(props as LinkProps)} className={combinedClasses} style={variantStyles[variant]}>
        {children}
      </Link>
    );
  }

  return (
    <button
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={combinedClasses}
      style={variantStyles[variant]}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
