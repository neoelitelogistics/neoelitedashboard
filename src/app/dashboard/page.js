import { getDashboardData } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ManagementDashboard({ searchParams }) {
  const params = await searchParams;
  const filterStatus = params.status;
  const filterCustomer = params.customer;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Admin') redirect('/login');

  const allVehicles = await getDashboardData() || [];

  const idleLineVehicles = allVehicles.filter(
    v => v.mode === 'Line' && v.current_utilization === 'Idle'
  );

  const statusCounts = allVehicles.reduce((acc, v) => {
    const s = v.current_status || 'Not Updated';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const customerCounts = allVehicles.reduce((acc, v) => {
    const c = v.customer_name || 'No Customer';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const sortedCustomers = Object.entries(customerCounts).sort((a, b) => b[1] - a[1]);

  const displayedVehicles = allVehicles.filter(v => {
    const statusMatch = !filterStatus || (v.current_status || 'Not Updated') === filterStatus;
    const customerMatch = !filterCustomer || (v.customer_name || 'No Customer') === filterCustomer;
    return statusMatch && customerMatch;
  });

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
        <Link href="/dashboard" className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', border: !filterStatus ? '2px solid var(--accent-primary)' : '' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Total Fleet</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{allVehicles.length}</p>
        </Link>
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

      <h2 style={{ marginTop: '3rem' }}>Fleet Status Distribution (Click to filter)</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
        {sortedStatuses.map(([status, count]) => (
          <Link 
            key={status}
            href={`/dashboard?${new URLSearchParams({ ...params, status }).toString()}`}
            className="glass-card" 
            style={{ 
              minWidth: '180px',
              padding: '1rem', 
              textAlign: 'center', 
              cursor: 'pointer',
              border: filterStatus === status ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              backgroundColor: filterStatus === status ? '#eff6ff' : 'white'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{status}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{count}</div>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Vehicles per Customer (Click to filter)</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {sortedCustomers.map(([customer, count]) => (
          <Link 
            key={customer}
            href={`/dashboard?${new URLSearchParams({ ...params, customer }).toString()}`}
            className="glass-card" 
            style={{ 
              minWidth: '200px',
              padding: '1rem', 
              textAlign: 'center', 
              cursor: 'pointer',
              border: filterCustomer === customer ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              backgroundColor: filterCustomer === customer ? '#eff6ff' : 'white'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{customer}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{count}</div>
          </Link>
        ))}
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

      <h2 style={{ marginTop: '3rem' }}>
        {filterStatus || filterCustomer ? 'Filtered Vehicles' : 'Live Status Table (All Vehicles)'}
        {(filterStatus || filterCustomer) && (
          <Link href="/dashboard" style={{ fontSize: '0.875rem', marginLeft: '1rem', color: 'var(--accent-primary)', fontWeight: 'normal' }}>
            [Clear All Filters]
          </Link>
        )}
      </h2>
      {(filterStatus || filterCustomer) && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          {filterStatus && <span className="badge badge-info">Status: {filterStatus}</span>}
          {filterCustomer && <span className="badge badge-info">Customer: {filterCustomer}</span>}
        </div>
      )}
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
            {displayedVehicles.map(v => (
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
