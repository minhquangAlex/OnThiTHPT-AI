
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    }
  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-t-2 border-indigo-500`}></div>
  );
};

export default Spinner;