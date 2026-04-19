'use server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getAssignedVehicles() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) return null;
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Supervisor') return null;

  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  const vehicles = await db.all(`
    SELECT v.*, 
           (SELECT status FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_status,
           (SELECT location FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_location,
           (SELECT utilization FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_utilization
    FROM Vehicles v
    WHERE v.supervisor_username = ?
  `, [today, today, today, user.username]);

  return vehicles;
}

export async function bulkUpdateVehicles(truckIds, customer_name, location, status) {
  if (!truckIds || truckIds.length === 0) return;

  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const idleStatuses = [
    'Idle - Waiting for load',
    'Breakdown',
    'No Driver',
    'Driver Absent',
    'Issue With Driver',
    'Service Center',
    'Accident',
    'Driver on the Way'
  ];
  const utilization = idleStatuses.includes(status) ? 'Idle' : 'Active';

  for (const truck_id of truckIds) {
    if (customer_name) {
      await db.run('UPDATE Vehicles SET customer_name = ? WHERE truck_id = ?', [customer_name, truck_id]);
    }

    const existing = await db.get('SELECT id FROM Daily_Logs WHERE truck_id = ? AND log_date = ?', [truck_id, today]);

    if (existing) {
      await db.run(
        'UPDATE Daily_Logs SET location = ?, status = ?, utilization = ? WHERE id = ?',
        [location, status, utilization, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO Daily_Logs (truck_id, log_date, location, status, utilization) VALUES (?, ?, ?, ?, ?)',
        [truck_id, today, location, status, utilization]
      );
    }
  }

  revalidatePath('/supervisor');
  revalidatePath('/dashboard');
}
