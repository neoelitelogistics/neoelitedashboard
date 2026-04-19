import { getVehicles, addVehicle, deleteVehicle, getSupervisors } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
        <h3>Add New Vehicle</h3>
        <form action={addVehicle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Truck ID</label>
            <input type="text" name="truck_id" className="input-field" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Vehicle No</label>
            <input type="text" name="vehicle_no" className="input-field" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Vehicle Type</label>
            <input type="text" name="vehicle_type" className="input-field" defaultValue="MXL" required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Mode</label>
            <select name="mode" className="input-field" required>
              <option value="Line">Line</option>
              <option value="Dedicated">Dedicated</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Customer Name</label>
            <input type="text" name="customer_name" className="input-field" />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Supervisor</label>
            <select name="supervisor_username" className="input-field" required>
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
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Truck ID</th>
              <th>Vehicle No</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Customer</th>
              <th>Supervisor</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.truck_id}</td>
                <td style={{ fontWeight: 'bold' }}>{v.vehicle_no}</td>
                <td>{v.vehicle_type}</td>
                <td><span className="badge">{v.mode}</span></td>
                <td>{v.customer_name}</td>
                <td>{v.supervisor_username}</td>
                <td>
                  <form action={deleteVehicle}>
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="badge badge-danger" style={{ border: 'none', cursor: 'pointer' }}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
