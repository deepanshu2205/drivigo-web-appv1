import React from 'react';

function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary-200 border-t-primary-500`}></div>
      {text && (
        <p className="mt-4 text-secondary-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
}

export default LoadingSpinner; 