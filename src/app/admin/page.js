import { getVehicles, addVehicle, getSupervisors } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminTable from './AdminTable';
import SupervisorManagement from './SupervisorManagement';

export const dynamic = 'force-dynamic';

export default async function AdminPanel() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Admin') redirect('/login');

  const vehicles = await getVehicles() || [];
  const supervisors = await getSupervisors() || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Vehicle Master Admin</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard" className="btn" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
            Back to Dashboard
          </Link>
          <div className="badge badge-info">Role: Admin</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginTop: 0 }}>Supervisor Management</h2>
        <SupervisorManagement supervisors={supervisors} />
      </div>

      <div className="glass-card" style={{ marginBottom: '3rem' }}>
        <h3>Add New Vehicle</h3>
        <form action={addVehicle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-truck-id">Truck ID</label>
            <input id="admin-add-truck-id" type="text" name="truck_id" className="input-field" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-vehicle-no">Vehicle No</label>
            <input id="admin-add-vehicle-no" type="text" name="vehicle_no" className="input-field" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-vehicle-type">Vehicle Type</label>
            <input id="admin-add-vehicle-type" type="text" name="vehicle_type" className="input-field" defaultValue="MXL" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-mode">Mode</label>
            <select id="admin-add-mode" name="mode" className="input-field" required>
              <option value="Line">Line</option>
              <option value="Dedicated">Dedicated</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-customer-name">Customer Name</label>
            <input id="admin-add-customer-name" type="text" name="customer_name" className="input-field" />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-supervisor">Supervisor</label>
            <select id="admin-add-supervisor" name="supervisor_username" className="input-field" required>
              <option value="">Select Supervisor</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.username}>{s.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1rem' }}>Add Vehicle</button>
        </form>
      </div>

      <h2>Master Database</h2>
      <AdminTable vehicles={vehicles} supervisors={supervisors} />
    </div>
  );
}
