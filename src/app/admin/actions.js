'use server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getVehicles() {
  const db = await getDb();
  return await db.all('SELECT * FROM Vehicles');
}

export async function getSupervisors() {
  const db = await getDb();
  return await db.all("SELECT * FROM Users WHERE role = 'Supervisor' ORDER BY name ASC");
}

export async function addVehicle(formData) {
  const truck_id = formData.get('truck_id');
  const vehicle_no = formData.get('vehicle_no');
  const vehicle_type = formData.get('vehicle_type');
  const mode = formData.get('mode');
  const customer_name = formData.get('customer_name');
  const supervisor_username = formData.get('supervisor_username');
  
  const db = await getDb();
  await db.run(
    'INSERT INTO Vehicles (truck_id, vehicle_no, vehicle_type, mode, customer_name, supervisor_username) VALUES (?, ?, ?, ?, ?, ?)',
    [truck_id, vehicle_no, vehicle_type, mode, customer_name, supervisor_username]
  );
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

export async function deleteVehicle(formData) {
  const id = formData.get('id');
  const db = await getDb();
  await db.run('DELETE FROM Vehicles WHERE id = ?', [id]);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

export async function updateVehicle(
  id,
  truck_id,
  vehicle_no,
  vehicle_type,
  mode,
  customer_name,
  supervisor_username
) {
  const db = await getDb();
  await db.run(
    `UPDATE Vehicles
     SET truck_id = ?, vehicle_no = ?, vehicle_type = ?, mode = ?, customer_name = ?, supervisor_username = ?
     WHERE id = ?`,
    [truck_id, vehicle_no, vehicle_type, mode, customer_name, supervisor_username, id]
  );
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}
