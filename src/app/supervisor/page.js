import { getAssignedVehicles } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SupervisorClient from './SupervisorClient';

export const dynamic = 'force-dynamic';

export default async function SupervisorDashboard({ searchParams }) {
  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split('T')[0];

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Supervisor') redirect('/login');

  const vehicles = await getAssignedVehicles(selectedDate) || [];

  return <SupervisorClient vehicles={vehicles} user={user} selectedDate={selectedDate} />;
}
