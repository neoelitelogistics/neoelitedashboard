import { getDashboardData } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ManagementDashboard() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Admin') redirect('/login');

  const allVehicles = await getDashboardData() || [];

  const idleLineVehicles = allVehicles.filter(
    v => v.mode === 'Line' && v.current_utilization === 'Idle'
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Management Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin" className="btn btn-primary">
            Vehicle Master Admin
          </Link>
          <div className="badge badge-info">Role: Admin</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Total Fleet</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{allVehicles.length}</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Active Vehicles</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>
            {allVehicles.filter(v => v.current_utilization === 'Active').length}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Idle Line Vehicles</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>
            {idleLineVehicles.length}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: '3rem', color: 'var(--danger)' }}>ACTION REQUIRED: Idle Line Vehicles</h2>
      {idleLineVehicles.length > 0 ? (
        <div className="table-container" style={{ borderColor: 'var(--danger-border)' }}>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Current Location</th>
                <th>Status</th>
                <th>Supervisor</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {idleLineVehicles.map(v => (
                <tr key={v.truck_id}>
                  <td style={{ fontWeight: 'bold' }}>{v.vehicle_no}</td>
                  <td>{v.current_location || 'Not Updated'}</td>
                  <td><span className="badge badge-danger">{v.current_status || 'Unknown'}</span></td>
                  <td>{v.supervisor_username.toUpperCase()}</td>
                  <td>{v.customer_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card">
          <p style={{ margin: 0, color: 'var(--success)', textAlign: 'center' }}>Great! All line vehicles are currently active.</p>
        </div>
      )}

      <h2 style={{ marginTop: '3rem' }}>Live Status Table (All Vehicles)</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Type / Mode</th>
              <th>Supervisor</th>
              <th>Location</th>
              <th>Status</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {allVehicles.map(v => (
              <tr key={v.truck_id}>
                <td>{v.vehicle_no}</td>
                <td>{v.vehicle_type} / <span className="badge">{v.mode}</span></td>
                <td>{v.supervisor_username}</td>
                <td>{v.current_location || '-'}</td>
                <td>{v.current_status || '-'}</td>
                <td>
                  <span className={`badge ${v.current_utilization === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {v.current_utilization || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
