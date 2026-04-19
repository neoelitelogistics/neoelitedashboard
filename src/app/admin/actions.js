'use server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function revalidateAdminRelatedPaths() {
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  revalidatePath('/login');
}

export async function getVehicles() {
  const db = await getDb();
  return await db.all('SELECT * FROM Vehicles');
}

export async function getSupervisors() {
  const db = await getDb();
  return await db.all(
    `SELECT u.*, COUNT(v.id) AS assigned_vehicles_count
     FROM Users u
     LEFT JOIN Vehicles v ON v.supervisor_username = u.username
     WHERE u.role = 'Supervisor'
     GROUP BY u.id, u.name, u.username, u.role
     ORDER BY u.name ASC`
  );
}

export async function addSupervisor(formData) {
  const name = String(formData.get('name') || '').trim();
  const username = normalizeUsername(formData.get('username'));

  if (!name) {
    return { ok: false, message: 'Supervisor name is required.' };
  }
  if (!username) {
    return { ok: false, message: 'Username is required.' };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, message: 'Username must contain only lowercase letters, numbers, and underscores.' };
  }

  const db = await getDb();
  const existingUser = await db.get(
    "SELECT id FROM Users WHERE role = 'Supervisor' AND LOWER(username) = LOWER(?)",
    [username]
  );

  if (existingUser) {
    return { ok: false, message: 'That username is already taken.' };
  }

  await db.run('INSERT INTO Users (name, username, role) VALUES (?, ?, ?)', [name, username, 'Supervisor']);
  revalidateAdminRelatedPaths();
  return { ok: true, message: 'Supervisor added successfully.' };
}

export async function updateSupervisor(formData) {
  const id = Number(formData.get('id'));
  const name = String(formData.get('name') || '').trim();
  const username = normalizeUsername(formData.get('username'));

  if (!id) {
    return { ok: false, message: 'Invalid supervisor selected.' };
  }
  if (!name) {
    return { ok: false, message: 'Supervisor name is required.' };
  }
  if (!username) {
    return { ok: false, message: 'Username is required.' };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, message: 'Username must contain only lowercase letters, numbers, and underscores.' };
  }

  const db = await getDb();
  const currentSupervisor = await db.get("SELECT * FROM Users WHERE id = ? AND role = 'Supervisor'", [id]);

  if (!currentSupervisor) {
    return { ok: false, message: 'Supervisor not found.' };
  }

  const duplicateUsername = await db.get(
    "SELECT id FROM Users WHERE role = 'Supervisor' AND LOWER(username) = LOWER(?) AND id != ?",
    [username, id]
  );
  if (duplicateUsername) {
    return { ok: false, message: 'That username is already taken.' };
  }

  try {
    await db.exec('BEGIN TRANSACTION');
    await db.run('UPDATE Users SET name = ?, username = ? WHERE id = ?', [name, username, id]);

    if (currentSupervisor.username !== username) {
      await db.run(
        'UPDATE Vehicles SET supervisor_username = ? WHERE supervisor_username = ?',
        [username, currentSupervisor.username]
      );
    }

    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }

  revalidateAdminRelatedPaths();
  return { ok: true, message: 'Supervisor updated successfully.' };
}

export async function deleteSupervisor(formData) {
  const id = Number(formData.get('id'));
  const confirmDelete = String(formData.get('confirm_delete') || '') === 'yes';
  const reassignTo = normalizeUsername(formData.get('reassign_to'));

  if (!id) {
    return { ok: false, message: 'Invalid supervisor selected.' };
  }
  if (!confirmDelete) {
    return { ok: false, message: 'Deletion was not confirmed.' };
  }

  const db = await getDb();
  const supervisor = await db.get("SELECT * FROM Users WHERE id = ? AND role = 'Supervisor'", [id]);
  if (!supervisor) {
    return { ok: false, message: 'Supervisor not found.' };
  }

  const assignedCountRow = await db.get(
    'SELECT COUNT(*) AS count FROM Vehicles WHERE supervisor_username = ?',
    [supervisor.username]
  );
  const assignedCount = Number(assignedCountRow?.count || 0);
  if (assignedCount > 0) {
    if (!reassignTo) {
      return {
        ok: false,
        message: `Select a supervisor to reassign ${assignedCount} assigned vehicle(s) before deletion.`,
      };
    }
    if (reassignTo === supervisor.username) {
      return {
        ok: false,
        message: 'Reassignment target must be a different supervisor.',
      };
    }

    const reassignmentTarget = await db.get(
      "SELECT id FROM Users WHERE role = 'Supervisor' AND LOWER(username) = LOWER(?)",
      [reassignTo]
    );
    if (!reassignmentTarget) {
      return { ok: false, message: 'Selected reassignment supervisor does not exist.' };
    }

    try {
      await db.exec('BEGIN TRANSACTION');
      await db.run('UPDATE Vehicles SET supervisor_username = ? WHERE supervisor_username = ?', [
        reassignTo,
        supervisor.username,
      ]);
      await db.run('DELETE FROM Users WHERE id = ? AND role = ?', [id, 'Supervisor']);
      await db.exec('COMMIT');
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }

    revalidateAdminRelatedPaths();
    return {
      ok: true,
      message: `${supervisor.name} deleted and ${assignedCount} vehicle(s) reassigned to ${reassignTo}.`,
    };
  }

  await db.run('DELETE FROM Users WHERE id = ? AND role = ?', [id, 'Supervisor']);
  revalidateAdminRelatedPaths();
  return { ok: true, message: 'Supervisor deleted successfully.' };
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
