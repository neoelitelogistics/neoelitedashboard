'use server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

const locationRequiredStatuses = new Set([
  'Breakdown',
  'Service Center',
  'Accident',
  'Driver Absent',
  'Issue With Driver'
]);

export async function getAssignedVehicles(date) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) return null;
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Supervisor') return null;

  const db = await getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const vehicles = await db.all(`
    SELECT v.*, 
           (SELECT status FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_status,
           (SELECT location FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_location,
           (SELECT utilization FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_utilization,
           (SELECT last_updated_at FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_last_updated_at,
           (SELECT last_updated_by FROM Daily_Logs WHERE truck_id = v.truck_id AND log_date = ?) as current_last_updated_by
    FROM Vehicles v
    WHERE v.supervisor_username = ?
  `, [targetDate, targetDate, targetDate, targetDate, targetDate, user.username]);

  return vehicles;
}

export async function bulkUpdateVehicles(truckIds, customer_name, location, status, date) {
  if (!truckIds || truckIds.length === 0) return;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) {
    throw new Error('Unauthorized');
  }

  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Supervisor') {
    throw new Error('Unauthorized');
  }

  const db = await getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const normalizedLocation = String(location || '').trim();
  const normalizedCustomerName = String(customer_name || '').trim();
  const updatedAt = new Date().toISOString();

  if (locationRequiredStatuses.has(status) && !normalizedLocation) {
    throw new Error(`Location is required when status is "${status}".`);
  }

  const utilization = idleStatuses.includes(status) ? 'Idle' : 'Active';

  for (const truck_id of truckIds) {
    if (normalizedCustomerName) {
      await db.run('UPDATE Vehicles SET customer_name = ? WHERE truck_id = ?', [normalizedCustomerName, truck_id]);
    }

    const existing = await db.get('SELECT id FROM Daily_Logs WHERE truck_id = ? AND log_date = ?', [truck_id, targetDate]);

    if (existing) {
      await db.run(
        'UPDATE Daily_Logs SET location = ?, status = ?, utilization = ?, last_updated_at = ?, last_updated_by = ? WHERE id = ?',
        [normalizedLocation, status, utilization, updatedAt, user.username, existing.id]
      );
    } else {
      await db.run(
        'INSERT INTO Daily_Logs (truck_id, log_date, location, status, utilization, last_updated_at, last_updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [truck_id, targetDate, normalizedLocation, status, utilization, updatedAt, user.username]
      );
    }
  }

  revalidatePath('/supervisor');
  revalidatePath('/dashboard');
}
