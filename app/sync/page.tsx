'use client';

import React, { useState } from 'react';

type LogEntry = {
  id: number;
  msg: string;
  status: 'success' | 'process' | 'error' | 'info';
  time: string;
};

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function SyncPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [customPath, setCustomPath] = useState('');

  const addLog = (msg: string, status: LogEntry['status']) => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg, status, time: now() }, ...prev]);
  };

  const handleSync = async (forceAll: boolean = false) => {
    if (syncing) return;
    setSyncing(true);
    setLogs([]);

    addLog(`Sincronización manual iniciada por el Administrador ${forceAll ? '(REPROCESO COMPLETO)' : '(Optimizada)'}.`, 'info');
    addLog(`Escaneando ruta: ${customPath || 'Carpeta por defecto "JSON examples"'}...`, 'process');

    try {
      const payload = { 
        path: customPath || undefined,
        forceAll 
      };
      const res = await fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        addLog(`Error del servidor: ${data.error || 'Desconocido'}`, 'error');
        setSyncing(false);
        return;
      }

      // Log de resultados por archivo
      if (data.results && Array.isArray(data.results)) {
        for (const r of data.results) {
          if (r.status === 'ok') {
            addLog(`✅ ${r.filename} → ${r.events} eventos procesados.`, 'success');
          } else if (r.status === 'skipped') {
            // No loguear todos los salteados para no ensuciar la terminal
          } else {
            addLog(`❌ ${r.filename} → Error: ${r.error}`, 'error');
          }
        }
      }

      if (data.skipped > 0) {
        addLog(`⏭️ ${data.skipped} misiones previamente sincronizadas fueron salteadas.`, 'info');
      }

      addLog(
        `Sincronización completada. ${data.ok} subidas | ${data.skipped} saltadas | ${data.failed} error | ${data.total} total.`,
        data.failed === 0 ? 'success' : 'info'
      );

    } catch (e: any) {
      addLog(`Error de conexión con la API: ${e.message}`, 'error');
    }

    setSyncing(false);
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
            <p className="text-sm text-gray-400">Escaneando carpeta local <code className="text-cyan-400">JSON examples/</code> y enviando a Supabase.</p>
          </div>
          <div className="flex flex-col items-end gap-3 flex-wrap">
            <div className="flex gap-2 w-full flex-wrap sm:flex-nowrap">
              <input 
                type="text" 
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="Ej: C:\Users\Meme\Desktop\A3Stats\CustomJSONs (dejar en blanco para default)"
                className="flex-[2] bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 min-w-[250px]"
                disabled={syncing}
              />
              <button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className={`px-4 py-2 rounded-lg shadow-lg flex shrink-0 items-center justify-center gap-2 font-medium text-sm transition-all ${
                  syncing
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400'
                }`}
              >
                <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {syncing ? 'Procesando...' : 'Sincronizar (Nuevas)'}
              </button>
              
              <button
                onClick={() => handleSync(true)}
                disabled={syncing}
                title="Sobrescribe todas las misiones y eventos iterando cada archivo en la carpeta."
                className={`px-4 py-2 rounded-lg shadow-lg flex shrink-0 items-center justify-center gap-2 font-medium text-sm transition-all ${
                  syncing
                    ? 'bg-red-600/30 text-red-300 border border-red-500/30 cursor-wait'
                    : 'bg-gradient-to-r from-red-500/20 to-orange-600/20 hover:from-red-500/30 hover:to-orange-600/30 border border-red-500/30 hover:border-red-500/50 text-red-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Fozar Completa
              </button>
            </div>
            <p className="text-xs text-gray-500">*La ruta es relativa al proyecto o ruta absoluta en tu PC.</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#090b10] border-gray-800 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

          <div className="p-6 h-[480px] overflow-y-auto font-mono text-sm space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p className="text-sm">Presiona <span className="text-cyan-400 font-semibold">Forzar Sincronización Local</span> para iniciar el escaneo.</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-start gap-4">
                  <span className="text-gray-500 shrink-0 w-16 tabular-nums">[{log.time}]</span>
                  <span className={`shrink-0 flex w-2 h-2 mt-1.5 rounded-full ${
                    log.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                    log.status === 'error'   ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                    log.status === 'info'    ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' :
                    'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  }`} />
                  <span className={`flex-1 break-all ${
                    log.status === 'success' ? 'text-gray-300' :
                    log.status === 'error'   ? 'text-red-400' :
                    log.status === 'info'    ? 'text-blue-300' :
                    'text-yellow-200/80 animate-pulse'
                  }`}>
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 text-xs text-gray-600 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Archivos ya procesados se actualizan por UPSERT (no se duplican). Solo JSONs en la carpeta <code className="text-gray-500">JSON examples/</code> del servidor.
        </div>
      </div>
    </main>
  );
}
