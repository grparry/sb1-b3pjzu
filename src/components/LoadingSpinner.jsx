import React from 'react';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white mb-8">
        <span className="text-white">ENGAGEMENT</span>{' '}
        <span className="text-gray-300">Studios</span>
      </h1>
      <button className="bg-sky-400 text-white px-8 py-2 rounded-full animate-pulse">
        START
      </button>
    </div>
  );
}

export default LoadingSpinner;