'use client';

import React, { useState, useMemo } from 'react';

export type PlayerKill = {
  victimAlias: string;
  weapon: string;
  distance: number;
  missionName: string;
  playedAt: string;
};

export function PlayerKillsTable({ kills }: { kills: PlayerKill[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof PlayerKill>('playedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [weaponFilter, setWeaponFilter] = useState('');
  const [missionFilter, setMissionFilter] = useState('');

  const uniqueWeapons   = useMemo(() => Array.from(new Set(kills.map(k => k.weapon).filter(Boolean))).sort(), [kills]);
  const uniqueMissions  = useMemo(() => Array.from(new Set(kills.map(k => k.missionName).filter(Boolean))).sort(), [kills]);

  const filtered = useMemo(() => {
    return kills
      .filter(k =>
        k.victimAlias.toLowerCase().includes(search.toLowerCase()) ||
        k.weapon.toLowerCase().includes(search.toLowerCase()) ||
        k.missionName.toLowerCase().includes(search.toLowerCase())
      )
      .filter(k => (weaponFilter  ? k.weapon === weaponFilter   : true))
      .filter(k => (missionFilter ? k.missionName === missionFilter : true))
      .sort((a, b) => {
        let valA: any = a[sortBy] ?? '';
        let valB: any = b[sortBy] ?? '';
        if (sortBy === 'distance') {
          valA = Number(valA); valB = Number(valB);
        }
        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [kills, search, sortBy, sortDesc]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof PlayerKill) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  const formatDate = (ds: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ds));

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <input
            type="text" placeholder="Buscar víctima, arma o misión..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[240px]"
          />
          <select value={weaponFilter} onChange={(e) => setWeaponFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer">
            <option value="">Cualquier Arma</option>
            {uniqueWeapons.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={missionFilter} onChange={(e) => setMissionFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer">
            <option value="">Cualquier Misión</option>
            {uniqueMissions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mostrar:</span>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm text-white cursor-pointer"
          >
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-gray-400 tracking-wider">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('victimAlias')}>Víctima {sortBy === 'victimAlias' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('weapon')}>Arma {sortBy === 'weapon' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('distance')}>Distancia (m) {sortBy === 'distance' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('missionName')}>Misión {sortBy === 'missionName' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('playedAt')}>Fecha {sortBy === 'playedAt' && (sortDesc ? '▼' : '▲')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((k, i) => (
              <tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-3 font-medium text-red-400/90 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-red-500/60 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                  {k.victimAlias}
                </td>
                <td className="px-6 py-3 text-gray-300 text-xs font-mono">{k.weapon}</td>
                <td className="px-6 py-3 text-center text-yellow-400/80 font-mono">{k.distance.toFixed(0)}m</td>
                <td className="px-6 py-3 text-gray-400 text-xs">{k.missionName}</td>
                <td className="px-6 py-3 text-right text-gray-400 opacity-80 text-xs">{formatDate(k.playedAt)}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Sin bajas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.02]">
        <span className="text-xs text-gray-500">
          Mostrando {paginated.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filtered.length)} de {filtered.length}
        </span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Siguiente</button>
        </div>
      </div>
    </div>
  );
}
