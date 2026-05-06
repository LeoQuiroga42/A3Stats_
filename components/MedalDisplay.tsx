'use client';

import { useState } from 'react';

interface Medal {
  id: string;
  image: string;
  name?: string;
  description?: string;
}

export interface MedalDisplayProps {
  medals: Medal[];
}

export function MedalDisplay({ medals }: MedalDisplayProps) {
  const [selectedMedal, setSelectedMedal] = useState<Medal | null>(null);

  return (
    <>
      <div className="w-full max-w-[1600px] z-10 mb-8">
        <h3 className="text-lg font-bold text-white/90 mb-4 flex items-center gap-2">
          Medallero
        </h3>

        <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-4">
          {medals.length === 0 ? (
            <div className="text-gray-400 text-sm py-4">No hay medallas para mostrar</div>
          ) : (
            <div className="flex gap-2 items-center">
              {medals.map((medal) => (
                <button
                  key={medal.id}
                  onClick={() => setSelectedMedal(medal)}
                  className="w-14 h-14 rounded-lg overflow-hidden hover:scale-110 transition-transform cursor-pointer group ring-1 ring-amber-500/30 shadow-md shrink-0 p-0 border-0"
                  title={medal.name || 'Medal'}
                >
                  <img
                    src={medal.image}
                    alt={medal.name || 'Medal'}
                    className="w-full h-full object-contain bg-gradient-to-br from-black/50 to-black/30"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedMedal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedMedal(null)}
        >
          <div
            className="bg-[#0d1017]/95 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedMedal.name}</h2>
              <button
                onClick={() => setSelectedMedal(null)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative bg-gradient-to-br from-black/50 to-black/30 rounded-xl p-6 flex items-center justify-center min-h-[300px]">
              <img
                src={selectedMedal.image}
                alt={selectedMedal.name || 'Medal'}
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>

            <div className="mt-6 text-center">
              {selectedMedal.description && (
                <p className="text-gray-500 text-xs mt-2">{selectedMedal.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
