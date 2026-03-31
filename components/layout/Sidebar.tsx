'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Category } from '@/app/layout';

const navigation = [
  { name: 'General', href: '/', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { name: 'Jugadores', href: '/jugadores', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
  { name: 'Equipos', href: '/equipos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
  { name: 'Sincronización', href: '/sync', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> },
  { name: 'Configuración', href: '/configuracion', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
];

export function Sidebar({ categories, isAdmin = false }: { categories: Category[], isAdmin?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCat = searchParams.get('cat') || '';

  // Construye la URL manteniendo el query param ?cat= en los links de navegación
  const buildHref = useCallback((href: string) => {
    if (!currentCat) return href;
    return `${href}?cat=${currentCat}`;
  }, [currentCat]);

  const handleCategoryChange = (catId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) params.set('cat', catId);
    else params.delete('cat');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Badge de la categoría activa
  const activeCat = categories.find(c => c.id === currentCat);

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-[rgba(255,255,255,0.05)] bg-[#0d1117]/80 flex flex-col pt-8 pb-4 backdrop-blur-3xl rounded-none md:rounded-r-2xl md:my-4 transition-all">
      <div className="flex items-center justify-center mb-8 pb-6 border-b border-white/5">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          A3<span className="text-white">STATS</span>
        </h1>
      </div>

      {/* ── Filtro de Contexto ─────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-1">Contexto</p>
        <div className="relative">
          <select
            value={currentCat}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white cursor-pointer appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="">📊 Todo (sin filtro)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Badge de categoría activa */}
        {activeCat && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: `${activeCat.color}15`, border: `1px solid ${activeCat.color}40` }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeCat.color }} />
            <span className="text-[10px] font-medium truncate" style={{ color: activeCat.color }}>{activeCat.name}</span>
          </div>
        )}
      </div>

      {/* ── Navegación ─────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {navigation.map((item) => {
          if (!isAdmin && (item.name === 'Sincronización' || item.name === 'Configuración')) return null;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={buildHref(item.href)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 mt-auto">
        {isAdmin ? (

          <a href="/api/logout" className="w-full flex items-center p-3 space-x-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-left group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xs text-white">
              ADM
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">Administrador</p>
              <p className="text-[10px] text-red-400 font-bold group-hover:underline">Cerrar Sesión</p>
            </div>
          </a>
        ) : (
          <Link href="/login" className="flex items-center p-3 space-x-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Visitante</p>
              <p className="text-[10px] text-blue-400 font-bold hover:underline">Iniciar Sesión Admin</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
