'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

type Category = { id: string; name: string; keywords: string[]; color: string; created_at: string; match_count?: number };
type MatchRow = { id: string; mission_name: string; played_at: string; category_id: string | null; match_categories: { name: string; color: string } | null };

const PRESET_COLORS = ['#3B82F6','#F59E0B','#10B981','#EF4444','#8B5CF6','#F97316','#06B6D4','#EC4899'];

import { updateAdminPassword } from './actions';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export default function ConfiguracionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [unclassified, setUnclassified] = useState<MatchRow[]>([]);
  const [allMatches, setAllMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'cats' | 'matches' | 'security'>('cats');

  // Modal nueva categoría
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Password Update
  const [pwd, setPwd] = useState('');
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');

  const supabase = getSupabase();

  const load = async () => {
    setLoading(true);
    const [{ data: cats }, { data: matches }] = await Promise.all([
      supabase.from('match_categories').select('*').order('created_at'),
      supabase.from('matches').select('id, mission_name, played_at, category_id, match_categories(name, color)').order('played_at', { ascending: false }).limit(500),
    ]);

    const catList = cats || [];
    const matchList = (matches || []) as any[];

    // Contar partidas por categoría
    const countMap: Record<string, number> = {};
    matchList.forEach((m) => { if (m.category_id) countMap[m.category_id] = (countMap[m.category_id] || 0) + 1; });
    setCategories(catList.map(c => ({ ...c, match_count: countMap[c.id] || 0 })));
    setAllMatches(matchList);
    setUnclassified(matchList.filter(m => !m.category_id));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditCat(null); setFormName(''); setFormKeywords(''); setFormColor(PRESET_COLORS[0]); setShowModal(true);
  };
  const openEdit = (cat: Category) => {
    setEditCat(cat); setFormName(cat.name); setFormKeywords(cat.keywords.join(', ')); setFormColor(cat.color); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const keywords = formKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const payload = { name: formName.trim(), keywords, color: formColor };
    if (editCat) {
      await supabase.from('match_categories').update(payload).eq('id', editCat.id);
    } else {
      await supabase.from('match_categories').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Las partidas quedarán sin clasificar.')) return;
    await supabase.from('match_categories').delete().eq('id', id);
    load();
  };

  const handleAutoAssign = async () => {
    const cats = categories.filter(c => c.keywords.length > 0);
    let updated = 0;
    for (const match of unclassified) {
      const missionLower = (match.mission_name || '').toLowerCase();
      const matched = cats.find(c => c.keywords.every(kw => missionLower.includes(kw.toLowerCase())));
      if (matched) {
        await supabase.from('matches').update({ category_id: matched.id }).eq('id', match.id);
        updated++;
      }
    }
    alert(`${updated} partidas clasificadas automáticamente.`);
    load();
  };

  const handleAssignMatch = async (matchId: string, catId: string | null) => {
    await supabase.from('matches').update({ category_id: catId || null }).eq('id', matchId);
    load();
  };

  const formatDate = (ds: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ds));

  return (
    <main className="flex min-h-screen flex-col items-center p-4 lg:p-8 xl:p-10 relative z-0">
      <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-slate-600/10 blur-[120px] -z-10 pointer-events-none" />

      <div className="relative flex flex-col place-items-center mb-10 z-10 w-full max-w-[1600px] text-center pt-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[4rem] drop-shadow-md mb-4 leading-tight">
          Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-200">Configuración</span>
        </h1>
        <p className="text-md text-gray-400 max-w-2xl bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          Gestión de categorías de partidas y clasificación de operaciones.
        </p>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-[1600px] z-10">
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button onClick={() => setTab('cats')} className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'cats' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Categorías
          </button>
          <button onClick={() => setTab('matches')} className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'matches' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Clasificar Partidas
            {unclassified.length > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">{unclassified.length} sin clasificar</span>}
          </button>
          <button onClick={() => setTab('security')} className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'security' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            Seguridad
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando...</div>
        ) : tab === 'cats' ? (
          /* ─── Tab Categorías ─────────────────────────────────────────── */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Categorías registradas ({categories.length})</h2>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-sm font-medium transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Nueva Categoría
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-5" style={{ borderLeft: `3px solid ${cat.color}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CategoryBadge name={cat.name} color={cat.color} />
                      <p className="text-xs text-gray-500 mt-2">{cat.match_count} partida{cat.match_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  {cat.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cat.keywords.map(kw => (
                        <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-500">No hay categorías. Crea la primera.</div>
              )}
            </div>
          </div>
        ) : tab === 'matches' ? (
          /* ─── Tab Clasificar Partidas ─────────────────────────────────────────── */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Todas las partidas ({allMatches.length})</h2>
              <button onClick={handleAutoAssign} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-sm font-medium transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Re-ejecutar Autodetección
              </button>
            </div>

            <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Misión</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría actual</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Asignar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allMatches.map(m => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-white/90 font-medium">{m.mission_name}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(m.played_at)}</td>
                      <td className="px-6 py-3">
                        {m.match_categories ? (
                          <CategoryBadge name={m.match_categories.name} color={m.match_categories.color} />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 border border-gray-500/20 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Sin clasificar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={m.category_id || ''}
                          onChange={(e) => handleAssignMatch(m.id, e.target.value || null)}
                          className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white cursor-pointer focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="">Sin clasificar</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'security' ? (
          /* ─── Tab Seguridad ─────────────────────────────────────────── */
          <div className="max-w-md mx-auto mt-20">
            <div className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-6 border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <h2 className="text-xl font-bold text-white mb-2">Credencial de Acceso</h2>
              <p className="text-xs text-gray-400 mb-6">Modifica la contraseña única del Panel de Administrador de A3Stats. Esta sobreescribe el default.</p>

              <div className="space-y-4">
                <input 
                  type="password" 
                  value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setPwdStatus('idle'); }}
                  placeholder="Nueva contraseña..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                />
                
                {pwdStatus === 'ok' && <p className="text-xs text-green-400 font-medium">Contraseña actualizada exitosamente en el servidor.</p>}
                {pwdStatus === 'err' && <p className="text-xs text-red-400 font-medium">Ocurrió un error al actualizar.</p>}

                <button 
                  onClick={async () => {
                    if (!pwd.trim()) return;
                    setPwdStatus('saving');
                    const res = await updateAdminPassword(pwd);
                    if (res.success) { setPwdStatus('ok'); setPwd(''); }
                    else setPwdStatus('err');
                  }}
                  disabled={pwdStatus === 'saving' || !pwd.trim()}
                  className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-bold py-3 rounded-lg transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {pwdStatus === 'saving' ? 'AGREGANDO...' : 'CAMBIAR CONTRASEÑA'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── Modal Nueva/Editar Categoría ─────────────────────────────────┐ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md glass-panel bg-[#0d1117]/95 p-8 mx-4">
            <h2 className="text-xl font-bold text-white mb-6">{editCat ? 'Editar Categoría' : 'Nueva Categoría'}</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nombre</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="ej: Campaña Siria Libre 2026"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keywords de Autodetección</label>
                <input value={formKeywords} onChange={e => setFormKeywords(e.target.value)}
                  placeholder="ej: campaña, sirialibre  (separadas por coma)"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-[10px] text-gray-500 mt-1">La misión debe contener TODAS las keywords (case-insensitive).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${formColor === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-2 border-white/20"
                  />
                </div>
                {/* Preview */}
                <div className="mt-3"><CategoryBadge name={formName || 'Preview'} color={formColor} /></div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors border border-white/10">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !formName.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-sm font-medium transition-colors border border-blue-500/30 disabled:opacity-50">
                {saving ? 'Guardando...' : (editCat ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
