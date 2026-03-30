'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export type PlayerMatch = {
  matchId: string;
  missionName: string;
  mapName: string;
  side: string;
  role: string;
  squadName: string;
  kills: number;
  muertes: number;
  playedAt: string;
  category: { name: string; color: string } | null;
};

export function PlayerMatchesTable({ matches }: { matches: PlayerMatch[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof PlayerMatch>('playedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sideFilter, setSideFilter]   = useState('');
  const [mapFilter, setMapFilter]     = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [roleFilter, setRoleFilter]   = useState('');

  const uniqueSides = useMemo(() => Array.from(new Set(matches.map(m => m.side).filter(Boolean))).sort(), [matches]);
  const uniqueMaps  = useMemo(() => Array.from(new Set(matches.map(m => m.mapName).filter(Boolean))).sort(), [matches]);
  const uniqueRoles = useMemo(() => Array.from(new Set(matches.map(m => m.role).filter(Boolean))).sort(), [matches]);
  const uniqueCats  = useMemo(() => {
    const cats = new Set<string>();
    matches.forEach(m => { if (m.category) cats.add(m.category.name); });
    return Array.from(cats).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    return matches
      .filter(m => m.missionName.toLowerCase().includes(search.toLowerCase()) || m.mapName.toLowerCase().includes(search.toLowerCase()))
      .filter(m => (sideFilter ? m.side === sideFilter : true))
      .filter(m => (mapFilter  ? m.mapName === mapFilter : true))
      .filter(m => (catFilter  ? m.category?.name === catFilter : true))
      .filter(m => (roleFilter ? m.role === roleFilter : true))
      .sort((a, b) => {
        let valA: any = a[sortBy] ?? '';
        let valB: any = b[sortBy] ?? '';
        if (sortBy === 'kills' || sortBy === 'muertes') {
          valA = Number(valA); valB = Number(valB);
        }
        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [matches, search, sortBy, sortDesc]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof PlayerMatch) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  const formatDate = (ds: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ds));

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <input
            type="text" placeholder="Buscar misión o mapa..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[200px]"
          />
          <select
            value={sideFilter} onChange={e => { setSideFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Cualquier Bando</option>
            {uniqueSides.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={catFilter} onChange={e => { setCatFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Cualquier Categoría</option>
            {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer max-w-[150px] truncate"
          >
            <option value="">Cualquier Rol</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={mapFilter} onChange={(e) => { setMapFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer">
            <option value="">Cualquier Mapa</option>
            {uniqueMaps.map(m => <option key={m} value={m}>{m}</option>)}
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
              <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('missionName')}>Misión {sortBy === 'missionName' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('mapName')}>Mapa {sortBy === 'mapName' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('side')}>Bando {sortBy === 'side' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('role')}>Rol {sortBy === 'role' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('squadName')}>Escuadra {sortBy === 'squadName' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('kills')}>Kills {sortBy === 'kills' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('muertes')}>Muertes {sortBy === 'muertes' && (sortDesc ? '▼' : '▲')}</th>
              <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('playedAt')}>Fecha {sortBy === 'playedAt' && (sortDesc ? '▼' : '▲')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((m, i) => (
              <tr
                key={`${m.matchId}-${i}`}
                onClick={() => router.push(`/operaciones/${m.matchId}`)}
                className="group hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <td className="px-6 py-3 font-medium text-white/90 border-l-[3px] border-transparent group-hover:border-purple-500 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 group-hover:text-blue-400 transition-colors">{m.missionName}</span>
                      <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                    {m.category ? (
                      <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${m.category.color}15`, border: `1px solid ${m.category.color}40`, color: m.category.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.category.color }} />
                        {m.category.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 border border-gray-500/20 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        Sin clasificar
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-center"><span className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-300 border border-white/10">{m.mapName}</span></td>
                <td className="px-6 py-3 text-center">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${m.side === 'WEST' ? 'bg-blue-500/20 text-blue-400' : m.side === 'EAST' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{m.side}</span>
                </td>
                <td className="px-6 py-3 text-center text-gray-400 text-xs">{m.role || '-'}</td>
                <td className="px-6 py-3 text-center text-gray-400 text-xs">{m.squadName || '-'}</td>
                <td className="px-6 py-3 text-center text-blue-300 font-mono">{m.kills}</td>
                <td className="px-6 py-3 text-center text-gray-400 font-mono">{m.muertes}</td>
                <td className="px-6 py-3 text-right text-gray-400 opacity-80 text-xs">{formatDate(m.playedAt)}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Sin operaciones registradas.</td></tr>
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
