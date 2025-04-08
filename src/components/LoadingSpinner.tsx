import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'purple';
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClass = {
    blue: 'text-blue-500',
    white: 'text-white',
    purple: 'text-purple-600'
  };

  const spinnerClasses = `animate-spin ${sizeClass[size]} ${colorClass[color]} ${className}`;
  
  const spinner = (
    <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a1f2e]/80 z-50">
        <div className="text-center">
          {spinner}
          <p className="mt-2 text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return spinner;
} 