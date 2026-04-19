'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';

const MANAGEMENT_USERNAME = process.env.MANAGEMENT_USERNAME || 'management';
const MANAGEMENT_PASSWORD = process.env.MANAGEMENT_PASSWORD || 'neoelite@123';

const authCookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

export async function loginAs(username, role) {
  const cookieStore = await cookies();
  cookieStore.set('auth_user', JSON.stringify({ username, role }), authCookieOptions);
  if (role === 'Admin') {
    redirect('/dashboard');
  } else {
    redirect('/supervisor');
  }
}

export async function loginManagement(_prevState, formData) {
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  if (!username || !password) {
    return {
      message: 'Enter both username and password.',
    };
  }

  if (username !== MANAGEMENT_USERNAME || password !== MANAGEMENT_PASSWORD) {
    return {
      message: 'Invalid management credentials.',
    };
  }

  const db = await getDb();
  const adminUser =
    await db.get("SELECT username, role FROM Users WHERE role = 'Admin' ORDER BY id ASC LIMIT 1");

  if (!adminUser) {
    return {
      message: 'Management account is not configured in the database.',
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    'auth_user',
    JSON.stringify({ username: adminUser.username, role: adminUser.role }),
    authCookieOptions
  );

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_user');
  redirect('/login');
}
