'use client';

import React, { useState, useMemo } from 'react';
import { createTeam, updateTeam } from '@/app/equipos/actions';

export type TeamStat = {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  membersCount: number;
  kills: number;
  muertes: number;
  kd: string;
  createdAt: string;
  members: string[];
};

type MinimalPlayer = { uid: string; alias: string; assignedTeamId: string | null };

export function TeamsClient({ teams, allPlayers, isAdmin = false }: { teams: TeamStat[], allPlayers: MinimalPlayer[], isAdmin?: boolean }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredTeams = useMemo(() => {
    return teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.tag.toLowerCase().includes(search.toLowerCase()));
  }, [teams, search]);

  const filteredPlayersSelect = useMemo(() => {
    return allPlayers.filter(p => 
      (!p.assignedTeamId || p.assignedTeamId === editingTeamId) &&
      p.alias.toLowerCase().includes(playerSearch.toLowerCase())
    );
  }, [allPlayers, playerSearch, editingTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', teamName);
    formData.append('tag', teamTag);
    if (teamLogo) formData.append('logo_url', teamLogo);

    const res = editingTeamId 
      ? await updateTeam(editingTeamId, formData, selectedPlayers)
      : await createTeam(formData, selectedPlayers);
      
    setIsSubmitting(false);

    if (res.success) {
      closeModal();
    } else {
      setErrorMsg(res.error || 'Error al guardar el equipo. Verifica que las tablas de DB fueron creadas.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTeamName(''); setTeamTag(''); setTeamLogo(''); setSelectedPlayers([]);
    setEditingTeamId(null);
  };

  const openEditModal = (team: TeamStat) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setTeamTag(team.tag);
    setTeamLogo(team.logoUrl || '');
    setSelectedPlayers(team.members || []);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-[1600px] z-10 transition-all">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-xl font-bold text-white/90">Directorio de Escuadras Oficiales</h3>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all flex items-center gap-2 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Registrar Destacamento
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden w-full backdrop-blur-xl bg-[#0d1017]/80 flex flex-col">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02]">
          <input 
            type="text" placeholder="Buscar destacamento..." 
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white w-full max-w-sm"
          />
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 uppercase text-xs font-semibold text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Equipo</th>
                <th className="px-6 py-4 text-center">Operadores Asignados</th>
                <th className="px-6 py-4 text-center">Bajas Totales</th>
                <th className="px-6 py-4 text-center">Muertes Sufridas</th>
                <th className="px-6 py-4 text-center">K/D General</th>
                <th className="px-6 py-4 text-right">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTeams.map((e) => (
                <tr key={e.id} className="group hover:bg-white/[0.03] transition-colors cursor-default">
                  <td className="px-6 py-4 font-bold text-white/90 border-l-[3px] border-transparent group-hover:border-green-500 flex items-center gap-3">
                    {e.logoUrl ? (
                      <img src={e.logoUrl} alt={e.tag} className="w-8 h-8 rounded-md object-cover border border-green-500/20" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-green-700/50 to-emerald-600/50 border border-green-500/20 flex items-center justify-center font-black text-[10px]">
                        {e.tag}
                      </div>
                    )}
                    <span className="flex-1">{e.name}</span>
                    {isAdmin && (
                      <button onClick={() => openEditModal(e)} className="ml-3 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity focus:outline-none" title="Editar Equipo">
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 font-mono text-base">{e.membersCount}</td>
                  <td className="px-6 py-4 text-center text-blue-300 font-mono text-base">{e.kills}</td>
                  <td className="px-6 py-4 text-center text-gray-400 font-mono text-base">{e.muertes}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold \${parseFloat(e.kd) >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {e.kd}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 opacity-80">
                    {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(e.createdAt))}
                  </td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    La base de datos no contiene equipos con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f141f] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingTeamId ? 'Editar Destacamento' : 'Registro de Nuevo Destacamento'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">{errorMsg}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre del Equipo *</label>
                  <input required value={teamName} onChange={e=>setTeamName(e.target.value)} type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-green-500 transition-colors" placeholder="Ej. Task Force 141"/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">TAG (Prefijo) *</label>
                  <input required value={teamTag} onChange={e=>setTeamTag(e.target.value.toUpperCase())} type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-green-500 transition-colors" placeholder="Ej. [TF-141]"/>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">URL del Logo (Opcional)</label>
                <input value={teamLogo} onChange={e=>setTeamLogo(e.target.value)} type="url" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-green-500 transition-colors" placeholder="https://imgur.com/..."/>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                  <label className="text-sm font-semibold text-white">Asignación de Operadores Registrados</label>
                  <button type="button" 
                    onClick={() => {
                      if (!teamTag) return;
                      const tagLower = teamTag.toLowerCase();
                      const uidsByTag = allPlayers.filter(p => p.alias.toLowerCase().includes(tagLower)).map(p => p.uid);
                      const combined = Array.from(new Set([...selectedPlayers, ...uidsByTag]));
                      setSelectedPlayers(combined);
                    }}
                    className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-md border border-blue-500/30 transition-colors w-fit flex gap-2 items-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Autodetectar por {teamTag || 'TAG'}
                  </button>
                </div>
                
                {/* Selected Chips */}
                {selectedPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPlayers.map(uid => {
                      const p = allPlayers.find(x => x.uid === uid);
                      return (
                        <span key={uid} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/30 text-green-300">
                          {p?.alias}
                          <button type="button" onClick={() => setSelectedPlayers(prev => prev.filter(x => x !== uid))} className="hover:text-white ml-1">&times;</button>
                        </span>
                      )
                    })}
                  </div>
                )}

                <input type="text" placeholder="Buscar jugador por alias..." value={playerSearch} onChange={e=>setPlayerSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white mb-2"/>
                
                <div className="max-h-60 overflow-y-auto bg-black/20 border border-white/10 rounded-lg p-2 space-y-1">
                  {filteredPlayersSelect.length > 0 ? filteredPlayersSelect.map(p => (
                    <label key={p.uid} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer rounded-md transition-colors border border-transparent hover:border-white/10 group">
                      <input 
                        type="checkbox" 
                        checked={selectedPlayers.includes(p.uid)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlayers([...selectedPlayers, p.uid]);
                          else setSelectedPlayers(selectedPlayers.filter(id => id !== p.uid));
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-black/50 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900 cursor-pointer" 
                      />
                      <span className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">{p.alias}</span>
                    </label>
                  )) : <div className="p-4 text-sm text-gray-500 text-center">No se encontraron operadores disponibles.</div>}
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg transition flex items-center gap-2">
                  {isSubmitting ? 'Guardando...' : (editingTeamId ? 'Guardar Cambios' : 'Crear Equipo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
