import { getAssignedVehicles } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SupervisorClient from './SupervisorClient';

export default async function SupervisorDashboard() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Supervisor') redirect('/login');

  const vehicles = await getAssignedVehicles() || [];

  return <SupervisorClient vehicles={vehicles} user={user} />;
}
