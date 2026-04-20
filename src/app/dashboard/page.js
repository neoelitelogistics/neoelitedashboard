import { getDashboardData } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardDateRangeFilter from '@/components/DashboardDateRangeFilter';

export const dynamic = 'force-dynamic';

export default async function ManagementDashboard({ searchParams }) {
  const params = await searchParams;
  const filterStatus = params.status;
  const filterCustomer = params.customer;
  const today = new Date().toISOString().split('T')[0];
  const startDate = params.startDate || params.date || today;
  const endDate = params.endDate || params.date || today;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_user');
  if (!authCookie) redirect('/login');
  
  const user = JSON.parse(authCookie.value);
  if (user.role !== 'Admin') redirect('/login');

  const dashboardData = await getDashboardData(startDate, endDate);
  const allVehicles = dashboardData.vehicles || [];
  const rangeStart = dashboardData.rangeStart;
  const rangeEnd = dashboardData.rangeEnd;
  const isRangeView = rangeStart !== rangeEnd;

  const idleLineVehicles = allVehicles.filter(
    v => v.mode === 'Line' && v.current_utilization === 'Idle'
  );

  const statusCounts = dashboardData.statusCounts || {};
  const customerCounts = dashboardData.customerCounts || {};

  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const sortedCustomers = Object.entries(customerCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Management Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {isRangeView ? `Fleet history from ${rangeStart} to ${rangeEnd}` : `Fleet status for ${rangeStart}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <DashboardDateRangeFilter initialStartDate={rangeStart} initialEndDate={rangeEnd} baseUrl="/dashboard" />
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
          <h3 style={{ color: 'var(--text-secondary)' }}>{isRangeView ? 'Vehicles Updated' : 'Active Vehicles'}</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>
            {isRangeView ? dashboardData.summary.updatedVehicles : allVehicles.filter(v => v.current_utilization === 'Active').length}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>{isRangeView ? 'Range Log Entries' : 'Idle Line Vehicles'}</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>
            {isRangeView ? dashboardData.summary.totalLogEntries : idleLineVehicles.length}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Management Decision View</h2>
      <div className="dashboard-grid">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Stale Vehicles</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)', margin: 0 }}>
            {dashboardData.summary.staleVehicles}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Action Queue</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>
            {dashboardData.actionQueue.length}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Supervisors Tracked</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {dashboardData.supervisorPerformance.length}
          </p>
        </div>
      </div>

      {isRangeView && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Historical Summary</h2>
          <div className="dashboard-grid">
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Active Log Entries</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>
                {dashboardData.summary.activeLogEntries}
              </p>
            </div>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Idle Log Entries</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger)', margin: 0 }}>
                {dashboardData.summary.idleLogEntries}
              </p>
            </div>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Days with Updates</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {dashboardData.dailyBreakdown.length}
              </p>
            </div>
          </div>

          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicles Updated</th>
                  <th>Active Entries</th>
                  <th>Idle Entries</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.dailyBreakdown.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.updatedVehicles}</td>
                    <td>{day.activeEntries}</td>
                    <td>{day.idleEntries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Idle Aging Buckets</h2>
      <div className="customer-grid" style={{ marginBottom: '2rem' }}>
        {Object.entries(dashboardData.idleAgingBuckets).map(([bucket, count]) => (
          <div key={bucket} className="glass-card" style={{ textAlign: 'center', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{bucket}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>{count}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Supervisor Performance View</h2>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Supervisor</th>
              <th>Assigned Fleet</th>
              <th>Vehicles Updated</th>
              <th>Update Rate</th>
              <th>Active Days</th>
              <th>Idle Days</th>
              <th>Stale Vehicles</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.supervisorPerformance.map((entry) => (
              <tr key={entry.supervisor}>
                <td>{entry.supervisor.toUpperCase()}</td>
                <td>{entry.assignedFleet}</td>
                <td>{entry.updatedVehicles}</td>
                <td>{entry.updateRate}%</td>
                <td>{entry.activeDays}</td>
                <td>{entry.idleDays}</td>
                <td>{entry.staleVehicles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Fleet Utilization Trend</h2>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Active Entries</th>
              <th>Idle Entries</th>
              <th>Utilization Rate</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.fleetUtilizationTrend.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.activeEntries}</td>
                <td>{day.idleEntries}</td>
                <td>{day.utilizationRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2rem', color: 'var(--danger)' }}>Action Queue</h2>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Supervisor</th>
              <th>Customer</th>
              <th>Latest Status</th>
              <th>Idle Days</th>
              <th>Last Updated</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.actionQueue.map((vehicle) => (
              <tr key={vehicle.truck_id}>
                <td>{vehicle.vehicle_no}</td>
                <td>{vehicle.supervisor_username.toUpperCase()}</td>
                <td>{vehicle.customer_name || '-'}</td>
                <td>{vehicle.current_status || 'Not Updated'}</td>
                <td>{vehicle.idle_days}</td>
                <td>{vehicle.last_log_date || 'Never'}</td>
                <td>
                  {vehicle.is_stale
                    ? 'Stale update'
                    : vehicle.current_utilization === 'Idle'
                      ? 'Idle vehicle'
                      : 'Needs review'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2rem', color: 'var(--warning)' }}>Stale Data Alerts</h2>
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Supervisor</th>
              <th>Customer</th>
              <th>Last Updated Date</th>
              <th>Days Since Update</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.staleVehicles.length > 0 ? (
              dashboardData.staleVehicles.map((vehicle) => (
                <tr key={vehicle.truck_id}>
                  <td>{vehicle.vehicle_no}</td>
                  <td>{vehicle.supervisor_username.toUpperCase()}</td>
                  <td>{vehicle.customer_name || '-'}</td>
                  <td>{vehicle.last_log_date || 'Never'}</td>
                  <td>{vehicle.days_since_last_update ?? 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--success)' }}>
                  No stale vehicles in the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      <div className="customer-grid" style={{ marginBottom: '2rem' }}>
        {sortedCustomers.map(([customer, count]) => (
          <Link 
            key={customer}
            href={`/dashboard?${new URLSearchParams({ ...params, customer }).toString()}`}
            className="glass-card" 
            style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              cursor: 'pointer',
              border: filterCustomer === customer ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              backgroundColor: filterCustomer === customer ? '#eff6ff' : 'white',
              minHeight: '110px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-word' }}>{customer}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{count}</div>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: '3rem', color: 'var(--danger)' }}>
        {isRangeView ? 'Latest Idle Line Vehicles in Selected Range' : 'ACTION REQUIRED: Idle Line Vehicles'}
      </h2>
      {idleLineVehicles.length > 0 ? (
        <div className="table-container" style={{ borderColor: 'var(--danger-border)' }}>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                {isRangeView && <th>Last Updated</th>}
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
                  {isRangeView && <td>{v.last_log_date || 'Not Updated'}</td>}
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

    </div>
  );
}
