'use client';

import React, { useState, useMemo } from 'react';

export type MatchCategory = { name: string; color: string } | null;

export type Match = {
  id: string;
  mission_name: string;
  map_name: string;
  duration_seconds: number;
  played_at: string;
  category: MatchCategory;
};

function CategoryBadge({ category }: { category: MatchCategory }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 border border-gray-500/20 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Sin clasificar
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${category.color}15`, border: `1px solid ${category.color}40`, color: category.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}

export function MatchesTable({ matches }: { matches: Match[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Match>('played_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapFilter, setMapFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const uniqueCategories = useMemo(() => {
    const cats = new Map<string, string>();
    matches.forEach(m => { if (m.category) cats.set(m.category.name, m.category.name); });
    return Array.from(cats.values()).sort();
  }, [matches]);

  const uniqueMaps = useMemo(() => Array.from(new Set(matches.map(m => m.map_name))), [matches]);

  const filteredMatches = useMemo(() => {
    return matches
      .filter(m => m.mission_name.toLowerCase().includes(search.toLowerCase()))
      .filter(m => (mapFilter ? m.map_name === mapFilter : true))
      .filter(m => (catFilter ? (m.category?.name === catFilter) : true))
      .sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (valA < valB) return sortDesc ? 1 : -1;
        if (valA > valB) return sortDesc ? -1 : 1;
        return 0;
      });
  }, [matches, search, sortBy, sortDesc, mapFilter]);

  const totalPages = Math.ceil(filteredMatches.length / rowsPerPage) || 1;
  const paginatedMatches = filteredMatches.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof Match) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s % 60}s`;
  };

  const formatDate = (ds: string) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ds));

  return (
    <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar misión..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white min-w-[200px]"
          />
          <select
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Cualquier Mapa</option>
            {uniqueMaps.map(map => <option key={map} value={map}>{map}</option>)}
          </select>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white cursor-pointer"
          >
            <option value="">Cualquier Categoría</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-gray-400 tracking-wider">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('mission_name')}>
                Designación de Misión {sortBy === 'mission_name' && (sortDesc ? '▼' : '▲')}
              </th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('map_name')}>
                Terreno {sortBy === 'map_name' && (sortDesc ? '▼' : '▲')}
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('duration_seconds')}>
                Duración {sortBy === 'duration_seconds' && (sortDesc ? '▼' : '▲')}
              </th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('played_at')}>
                Despliegue (UTC) {sortBy === 'played_at' && (sortDesc ? '▼' : '▲')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedMatches.map((match) => (
              <tr key={match.id} className="group hover:bg-white/[0.03] transition-colors cursor-default">
                <td className="px-6 py-4 font-medium text-white/90 border-l-[3px] border-transparent group-hover:border-blue-500 transition-colors">
                  {match.mission_name}
                </td>
                <td className="px-6 py-4">
                  <CategoryBadge category={match.category} />
                </td>
                <td className="px-6 py-4 text-gray-400">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                    {match.map_name}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 font-mono tracking-tight">
                  {formatDuration(match.duration_seconds)}
                </td>
                <td className="px-6 py-4 text-gray-400 text-right opacity-80">
                  {formatDate(match.played_at)}
                </td>
              </tr>
            ))}
            {paginatedMatches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron operaciones con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.02]">
        <span className="text-xs text-gray-500">
          Mostrando {paginatedMatches.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filteredMatches.length)} de {filteredMatches.length}
        </span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Anterior</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 bg-white/5 disabled:opacity-30 rounded hover:bg-white/10 text-sm transition-colors border border-white/10">Siguiente</button>
        </div>
      </div>
    </div>
  );
}
