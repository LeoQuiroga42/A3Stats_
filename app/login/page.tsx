import { login } from './actions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const isAdmin = cookies().get('a3stats_session')?.value === 'true';
  
  if (isAdmin) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 relative z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] -z-10 pointer-events-none" />

      <form action={login} className="glass-panel backdrop-blur-xl bg-[#0d1017]/80 p-8 w-full max-w-sm flex flex-col gap-6 border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-1">
            CONTROL DE ACCESO
          </h1>
          <p className="text-xs text-gray-400">Introduce la credencial de administrador</p>
        </div>

        {searchParams.error === '1' && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mt-2">
            Contraseña incorrecta. Acceso denegado.
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contraseña</label>
          <input 
            type="password" 
            name="password" 
            placeholder="••••••••••••" 
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            required 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
        >
          AUTENTICAR
        </button>

        <p className="text-center text-xs text-gray-500 mt-2">
          Si no cuentas con credenciales, continúa como <a href="/" className="text-blue-400 hover:underline">Visitante</a>.
        </p>
      </form>
    </main>
  );
}
