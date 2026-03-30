import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A3Stats | Centro de Comando",
  description: "Plataforma de estadísticas militares y análisis operativo para Arma 3 y Arma Reforger.",
};

export type Category = { id: string; name: string; color: string };

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fetch categories server-side para pasarlas al Sidebar
  let categories: Category[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('match_categories')
      .select('id, name, color')
      .order('created_at', { ascending: true })
      .limit(100);
    categories = data || [];
  } catch {
    // Si la tabla no existe aún, el sidebar muestra solo "Todo"
  }

  const isAdmin = cookies().get('a3stats_session')?.value === 'true';

  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-[#0d1117] relative text-[#e6edf3] overflow-x-hidden`}>
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 pointer-events-none"></div>
        <Sidebar categories={categories} isAdmin={isAdmin} />
        <div className="md:ml-64 transition-all duration-300 relative pb-16">
          {children}
        </div>
        
        {/* CTU Signature */}
        <div className="fixed bottom-4 right-6 flex items-center gap-3 z-50 opacity-50 hover:opacity-100 transition-opacity pointer-events-none md:pointer-events-auto mix-blend-screen md:mix-blend-normal">
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase shadow-black drop-shadow-md">
            By Comunidad Tactica Unida
          </span>
          <img 
            src="/ctu_logo.jpg" 
            alt="CTU Logo" 
            className="w-8 h-8 rounded-full object-cover border border-white/10 shadow-lg"
          />
        </div>
      </body>
    </html>
  );
}
