'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const pwd = formData.get('password') as string;
  const adminPwd = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (pwd === adminPwd) {
    cookies().set('a3stats_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });
    redirect('/');
  } else {
    redirect('/login?error=1');
  }
}

export async function logout() {
  cookies().delete('a3stats_session');
  redirect('/');
}
