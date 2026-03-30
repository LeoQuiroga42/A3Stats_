'use client';

import React, { useState } from 'react';

export default function SyncPage() {
  const [logs, setLogs] = useState<{ id: number; msg: string; status: 'success' | 'process' | 'error'; time: string }[]>([
    { id: 1, msg: '[Parser] Extracción de telemetría completada (2025-05-08_13-00.json)', status: 'success', time: '13:05' },
    { id: 2, msg: '[DB] Upsert 24 operadores en "matches_players" resuelto 200 OK.', status: 'success', time: '13:04' },
    { id: 3, msg: '[API /upload] Archivo local iterando chunk #2.', status: 'process', time: '13:03' },
    { id: 4, msg: 'Error de Sintaxis en línea 58: "missionStart" es nulo.', status: 'error', time: '12:45' }
  ]);

  const [syncing, setSyncing] = useState(false);

  const forceSync = () => {
    setSyncing(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Date.now(), msg: 'Sincronización manual forzada por el Administrador.', status: 'process', time }, ...prev]);
    
    setTimeout(() => {
      setSyncing(false);
      const timeF = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [{ id: Date.now() + 1, msg: 'Escaneo de directorio completado. No se encontraron nuevos JSONs.', status: 'success', time: timeF }, ...prev]);
    }, 2000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 lg:p-12 xl:p-24 relative z-0">
      <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="relative flex flex-col place-items-center mb-16 z-10 w-full max-w-5xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[4rem] drop-shadow-md mb-6 leading-tight">
          Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Sincronización</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          Monitorización del motor de parsing y transacciones de carga masivas hacia Supabase.
        </p>
      </div>
      
      <div className="w-full max-w-5xl z-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-bold text-white/90">Terminal de Ingestión</h3>
            <p className="text-sm text-gray-400">Escuchando en POST /api/upload y subcarpetas locales.</p>
          </div>
          <button 
            onClick={forceSync}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 font-medium text-sm transition-all \${
              syncing 
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400'
            }`}
          >
            <svg className={`w-4 h-4 \${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {syncing ? 'Escaneando Servidor...' : 'Forzar Sincronización Local'}
          </button>
        </div>

        <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#090b10] border-gray-800 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          
          <div className="p-6 h-[400px] overflow-y-auto font-mono text-sm space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4">
                <span className="text-gray-500 shrink-0 w-16">[{log.time}]</span>
                <span className={`shrink-0 flex w-2 h-2 mt-1.5 rounded-full \${
                  log.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                  log.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                  'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] pointer-events-none'
                }`}></span>
                <span className={`flex-1 \${
                  log.status === 'success' ? 'text-gray-300' :
                  log.status === 'error' ? 'text-red-400' :
                  'text-yellow-200/80 animate-pulse'
                }`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
