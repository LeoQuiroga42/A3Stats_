import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0d101d]/60 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-l-purple-500 border-r-purple-500 border-t-transparent border-b-transparent rounded-full animate-spin [animation-direction:reverse]"></div>
        </div>
        <p className="text-blue-400 font-bold tracking-[0.2em] text-sm animate-pulse flex items-center gap-2">
          DESENCRIPTANDO DATOS<span className="animate-bounce">...</span>
        </p>
      </div>
    </div>
  );
}
