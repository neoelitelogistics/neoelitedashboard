'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAs(username, role) {
  const cookieStore = await cookies();
  cookieStore.set('auth_user', JSON.stringify({ username, role }), { maxAge: 60 * 60 * 24 });
  if (role === 'Admin') {
    redirect('/dashboard');
  } else {
    redirect('/supervisor');
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_user');
  redirect('/login');
}
