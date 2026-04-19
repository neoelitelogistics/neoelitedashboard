'use server';
import { getDb } from '@/lib/db';

export async function getDashboardData(date) {
  const db = await getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get all vehicles with their daily log status
  const vehicles = await db.all(`
    SELECT v.*, 
           dl.status as current_status,
           dl.location as current_location,
           dl.utilization as current_utilization
    FROM Vehicles v
    LEFT JOIN Daily_Logs dl ON v.truck_id = dl.truck_id AND dl.log_date = ?
  `, [targetDate]);

  return vehicles;
}
