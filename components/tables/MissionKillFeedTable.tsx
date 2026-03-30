'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export type MissionKill = {
  id: string;
  eventTime: number;      // segundos desde inicio
  actorUid: string | null;
  actorAlias: string | null;
  targetUid: string | null;
  targetAlias: string | null;
  weapon: string | null;
  distance: number;
  isFriendlyFire: boolean;
};

function formatEventTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MissionKillFeedTable({ kills }: { kills: MissionKill[] }) {
  const [search, setSearch]       = useState('');
  const [ffFilter, setFfFilter]   = useState<'all' | 'ff' | 'normal'>('all');
  const [weaponFilter, setWeaponFilter] = useState('');
  const [rowsPerPage, setRowsPerPage]   = useState(25);
  const [currentPage, setCurrentPage]   = useState(1);

  const uniqueWeapons = useMemo(
    () => Array.from(new Set(kills.map(k => k.weapon).filter(Boolean))).sort() as string[],
    [kills]
  );

  const filtered = useMemo(() => {
    return kills
      .filter(k => {
        const q = search.toLowerCase();
        return (
          (k.actorAlias || '').toLowerCase().includes(q) ||
          (k.targetAlias || '').toLowerCase().includes(q) ||
          (k.weapon || '').toLowerCase().includes(q)
        );
      })
      .filter(k => weaponFilter ? k.weapon === weaponFilter : true)
      .filter(k => {
        if (ffFilter === 'ff')     return k.isFriendlyFire;
        if (ffFilter === 'normal') return !k.isFriendlyFire;
        return true;
      });
  }, [kills, search, weaponFilter, ffFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <input
            type="text" placeholder="Buscar operador o arma..."
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[200px]"
          />
          <select
            value={weaponFilter} onChange={e => { setWeaponFilter(e.target.value); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer max-w-[200px]"
          >
            <option value="">Cualquier Arma</option>
            {uniqueWeapons.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select
            value={ffFilter} onChange={e => { setFfFilter(e.target.value as any); setCurrentPage(1); }}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="all">Todos los eventos</option>
            <option value="normal">Solo kills enemigos</option>
            <option value="ff">Solo Friendly Fire</option>
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
              <th className="px-5 py-3 text-center">T+</th>
              <th className="px-5 py-3">Atacante</th>
              <th className="px-4 py-3 text-center"></th>
              <th className="px-5 py-3">Víctima</th>
              <th className="px-5 py-3">Arma</th>
              <th className="px-5 py-3 text-right">Distancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((k) => (
              <tr
                key={k.id}
                className={`group transition-colors ${
                  k.isFriendlyFire
                    ? 'bg-orange-500/5 hover:bg-orange-500/10 border-l-2 border-orange-500/40'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Tiempo */}
                <td className="px-5 py-2.5 text-center">
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                    {formatEventTime(k.eventTime)}
                  </span>
                </td>

                {/* Atacante */}
                <td className="px-5 py-2.5">
                  {k.actorUid ? (
                    <Link
                      href={`/jugadores/${encodeURIComponent(k.actorUid)}`}
                      className="font-semibold text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      {k.actorAlias || k.actorUid}
                    </Link>
                  ) : (
                    <span className="text-gray-500 italic text-xs">Desconocido</span>
                  )}
                </td>

                {/* Icono */}
                <td className="px-2 py-2.5 text-center">
                  {k.isFriendlyFire ? (
                    <span className="text-orange-400 text-sm" title="Friendly Fire">⚠️</span>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-red-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </td>

                {/* Víctima */}
                <td className="px-5 py-2.5">
                  {k.targetUid ? (
                    <Link
                      href={`/jugadores/${encodeURIComponent(k.targetUid)}`}
                      className="font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      {k.targetAlias || k.targetUid}
                    </Link>
                  ) : (
                    <span className="text-gray-500 italic text-xs">Desconocido</span>
                  )}
                </td>

                {/* Arma */}
                <td className="px-5 py-2.5">
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {k.weapon || '–'}
                  </span>
                </td>

                {/* Distancia */}
                <td className="px-5 py-2.5 text-right font-mono text-sm text-cyan-400">
                  {k.distance > 0 ? `${k.distance.toFixed(0)}m` : '–'}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Sin eventos de kill con los filtros actuales.
                </td>
              </tr>
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
