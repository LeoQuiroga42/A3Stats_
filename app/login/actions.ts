'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const pwd = formData.get('password') as string;
  let adminPwd = process.env.ADMIN_PASSWORD || 'admin123';
  
  try {
    const fs = await import('fs');
    if (fs.existsSync('admin_config.json')) {
      const config = JSON.parse(fs.readFileSync('admin_config.json', 'utf-8'));
      if (config.adminPassword) adminPwd = config.adminPassword;
    }
  } catch(e) {}
  
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
