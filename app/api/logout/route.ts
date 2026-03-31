import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Redirección forzada al home
  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Limpieza agresiva de la cookie de sesión
  response.cookies.set('a3stats_session', 'false', { 
    path: '/', 
    maxAge: 0, 
    expires: new Date(0),
    httpOnly: true,
  });
  
  // Evitar cualquier tipo de cache en la respuesta de logout
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  
  return response;
}
