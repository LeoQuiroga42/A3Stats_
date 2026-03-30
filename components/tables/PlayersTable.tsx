'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export type ActiveTeamInfo = { id: string; name: string; tag: string; logoUrl?: string; };

export type PlayerStat = {
  uid: string;
  alias: string;
  kills: number;
  muertes: number;
  tks: number;
  kd: string;
  survivalRate: string;
  lastMatchDate: string | null;
  activeTeam: ActiveTeamInfo | null;
  equiposDict: string[]; // Equipos jugados históricamente
};

export function PlayersTable({ players, activeTeamsList }: { players: PlayerStat[], activeTeamsList: ActiveTeamInfo[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof PlayerStat>('kills');
  const [sortDesc, setSortDesc] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [teamFilter, setTeamFilter] = useState('');

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.alias.toLowerCase().includes(search.toLowerCase()))
      .filter(p => {
         if (teamFilter === '') return true;
         if (teamFilter === 'NONE') return p.activeTeam === null;
         return p.activeTeam?.id === teamFilter;
      })
      .sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';

        // Normalizar strings numéricos para un ordenamiento perfecto
        if (sortBy === 'kd' || sortBy === 'survivalRate') {
          valA = parseFloat(valA as string) || 0;
          valB = parseFloat(valB as string) || 0;
        }

        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [players, search, sortBy, sortDesc, teamFilter]);

  const totalPages = Math.ceil(filteredPlayers.length / rowsPerPage) || 1;
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof PlayerStat) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const formatDate = (ds: string | null) => {
    if (!ds) return 'N/A';
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ds));
  };

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Buscar por Alias..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[200px]"
          />
          <select 
            value={teamFilter} 
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Todos los Operadores/Equipos</option>
            <option value="NONE">Operadores Independientes</option>
            {activeTeamsList.map(t => <option key={t.id} value={t.id}>[{t.tag}] {t.name}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mostrar:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm text-white cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-gray-400 tracking-wider">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('alias')}>Operador {sortBy === 'alias' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('kills')}>Kills {sortBy === 'kills' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('muertes')}>Muertes {sortBy === 'muertes' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors text-red-400/80" onClick={() => handleSort('tks')}>TK (Fuego Aliado) {sortBy === 'tks' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('kd')}>K/D Ratio {sortBy === 'kd' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('survivalRate')}>% Supervivencia {sortBy === 'survivalRate' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('lastMatchDate')}>Últ. Visto {sortBy === 'lastMatchDate' && (sortDesc ? '▼' : '▲')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedPlayers.map((p) => (
              <tr key={p.uid} onClick={() => router.push(`/jugadores/${encodeURIComponent(p.uid)}`)} className="group hover:bg-white/[0.04] transition-all cursor-pointer">
                <td className="px-6 py-4 font-bold text-white/90 border-l-[3px] border-transparent group-hover:border-blue-500 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 shadow-lg rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold text-[11px] border border-white/5">
                    {p.alias.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="group-hover:text-blue-400 transition-colors uppercase tracking-tight">{p.alias}</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {p.activeTeam ? (
                        <span className="flex items-center gap-1.5 mt-0.5 text-green-400">
                          {p.activeTeam.logoUrl && <img src={p.activeTeam.logoUrl} className="w-3.5 h-3.5 rounded-sm object-cover" />}
                          [{p.activeTeam.tag}] {p.activeTeam.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 mt-0.5 text-gray-500">
                          Operador Independiente
                        </span>
                      )}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </td>
                <td className="px-6 py-4 text-center text-blue-300 font-mono text-base">{p.kills}</td>
                <td className="px-6 py-4 text-center text-gray-400 font-mono text-base">{p.muertes}</td>
                <td className="px-6 py-4 text-center text-red-400/80 font-mono text-base">{p.tks > 0 ? p.tks : '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold \${parseFloat(p.kd) >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {p.kd}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-purple-300 font-mono text-base">{p.survivalRate}%</td>
                <td className="px-6 py-4 text-right text-gray-400 opacity-80">{formatDate(p.lastMatchDate)}</td>
              </tr>
            ))}
            {paginatedPlayers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay operadores que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.02]">
        <span className="text-xs text-gray-500">
          Mostrando {paginatedPlayers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filteredPlayers.length)} de {filteredPlayers.length}
        </span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Siguiente</button>
        </div>
      </div>
    </div>
  );
}
