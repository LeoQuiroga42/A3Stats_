import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0d101d]/60 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-tank-bumpy">
          <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 11h16a1 1 0 011 1v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1 1 0 011-1z" />
            <path d="M8 11V8a1 1 0 011-1h6a1 1 0 011 1v3" />
            <path d="M16 9h5" />
            <circle cx="6" cy="17" r="1.2" fill="black" />
            <circle cx="10" cy="17" r="1.2" fill="black" />
            <circle cx="14" cy="17" r="1.2" fill="black" />
            <circle cx="18" cy="17" r="1.2" fill="black" />
          </svg>
        </div>
        <p className="text-white font-bold tracking-[0.2em] text-sm animate-pulse flex items-center gap-2">
          DESPLEGANDO<span className="animate-bounce">...</span>
        </p>
      </div>
    </div>
  );
}
