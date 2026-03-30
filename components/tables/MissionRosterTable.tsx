'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export type MissionPlayer = {
  uid: string;
  alias: string;
  teamTag: string | null;
  teamName: string | null;
  side: string;
  squadName: string;
  role: string;
  kills: number;
  muertes: number;
  shots: number;
  hits: number;
};

function SideBadge({ side }: { side: string }) {
  const map: Record<string, string> = {
    WEST:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    EAST:  'bg-red-500/20 text-red-400 border-red-500/30',
    GUER:  'bg-green-500/20 text-green-400 border-green-500/30',
    CIV:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  const cls = map[side] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cls}`}>
      {side || '–'}
    </span>
  );
}

export function MissionRosterTable({ players }: { players: MissionPlayer[] }) {
  const [search, setSearch]           = useState('');
  const [sideFilter, setSideFilter]   = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [sortBy, setSortBy]           = useState<keyof MissionPlayer | 'kd'>('kills');
  const [sortDesc, setSortDesc]       = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueSides = useMemo(
    () => Array.from(new Set(players.map(p => p.side).filter(Boolean))).sort(),
    [players]
  );
  const uniqueSquads = useMemo(
    () => Array.from(new Set(players.map(p => p.squadName).filter(Boolean))).sort(),
    [players]
  );
  const uniqueRoles = useMemo(
    () => Array.from(new Set(players.map(p => p.role).filter(Boolean))).sort(),
    [players]
  );

  const filtered = useMemo(() => {
    return players
      .filter(p =>
        p.alias.toLowerCase().includes(search.toLowerCase()) ||
        (p.squadName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(search.toLowerCase())
      )
      .filter(p => sideFilter  ? p.side      === sideFilter  : true)
      .filter(p => squadFilter ? p.squadName === squadFilter : true)
      .filter(p => roleFilter  ? p.role      === roleFilter  : true)
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof MissionPlayer] ?? '';
        let valB: any = b[sortBy as keyof MissionPlayer] ?? '';
        
        if (sortBy === 'hits') {
          valA = a.shots > 0 ? a.hits / a.shots : 0;
          valB = b.shots > 0 ? b.hits / b.shots : 0;
        } else if (sortBy === 'kd') {
          valA = a.muertes > 0 ? a.kills / a.muertes : a.kills;
          valB = b.muertes > 0 ? b.kills / b.muertes : b.kills;
        }

        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [players, search, sideFilter, squadFilter, roleFilter, sortBy, sortDesc]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof MissionPlayer | 'kd') => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  const sortIndicator = (key: keyof MissionPlayer | 'kd') =>
    sortBy === key ? (sortDesc ? ' ▼' : ' ▲') : '';

  const kd = (p: MissionPlayer) =>
    p.muertes > 0 ? (p.kills / p.muertes).toFixed(2) : p.kills.toFixed(2);

  const precision = (p: MissionPlayer) =>
    p.shots > 0 ? `${((p.hits / p.shots) * 100).toFixed(1)}%` : 'N/A';

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <input
            type="text" placeholder="Buscar operador, escuadra, rol..."
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[220px]"
          />
          <select
            value={sideFilter} onChange={e => { setSideFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Todos los Bandos</option>
            {uniqueSides.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={squadFilter} onChange={e => { setSquadFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Todas las Escuadras</option>
            {uniqueSquads.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer max-w-[200px] truncate"
          >
            <option value="">Todos los Roles</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mostrar:</span>
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm text-white cursor-pointer"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-gray-400 tracking-wider">
            <tr>
              <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('alias')}>
                Operador{sortIndicator('alias')}
              </th>
              <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('side')}>
                Bando{sortIndicator('side')}
              </th>
              <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('squadName')}>
                Escuadra{sortIndicator('squadName')}
              </th>
              <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('role')}>
                Rol{sortIndicator('role')}
              </th>
              <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('kills')}>
                K{sortIndicator('kills')}
              </th>
              <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('muertes')}>
                D{sortIndicator('muertes')}
              </th>
              <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('kd')}>
                K/D{sortIndicator('kd')}
              </th>
              <th className="px-5 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('hits')}>
                Precisión{sortIndicator('hits')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map(p => (
              <tr key={p.uid} className="group hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3 border-l-[3px] border-transparent group-hover:border-blue-500 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/jugadores/${encodeURIComponent(p.uid)}`}
                      className="font-semibold text-white/90 hover:text-blue-400 transition-colors"
                    >
                      {p.alias}
                    </Link>
                    {p.teamTag && (
                      <span className="text-[10px] text-gray-500">[{p.teamTag}] {p.teamName}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-center"><SideBadge side={p.side} /></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{p.squadName || '–'}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{p.role || '–'}</td>
                <td className="px-5 py-3 text-center text-blue-300 font-mono font-bold">{p.kills}</td>
                <td className="px-5 py-3 text-center text-gray-400 font-mono">{p.muertes}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs font-bold font-mono ${parseFloat(kd(p)) >= 1 ? 'text-green-400' : 'text-orange-400'}`}>
                    {kd(p)}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-gray-400 text-xs font-mono">{precision(p)}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Sin operadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.02]">
        <span className="text-xs text-gray-500">
          Mostrando {filtered.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–{Math.min(currentPage * rowsPerPage, filtered.length)} de {filtered.length}
        </span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">
            Anterior
          </button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
