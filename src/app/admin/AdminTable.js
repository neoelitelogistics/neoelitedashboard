'use client';
import { useState } from 'react';
import EditModal from './EditModal';
import { deleteVehicle } from './actions';

export default function AdminTable({ vehicles, supervisors }) {
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const supervisorNameByUsername = new Map(
    supervisors.map((supervisor) => [supervisor.username, supervisor.name])
  );

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!normalizedQuery) return true;

    const supervisorName =
      supervisorNameByUsername.get(vehicle.supervisor_username)?.toLowerCase() || '';

    return [
      vehicle.vehicle_no,
      vehicle.customer_name,
      vehicle.mode,
      vehicle.supervisor_username,
      supervisorName,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <>
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label htmlFor="master-database-search">Search Master Database</label>
          <input
            id="master-database-search"
            type="text"
            className="input-field"
            placeholder="Search by vehicle number, customer, mode, or supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </p>
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.truck_id}</td>
                <td style={{ fontWeight: 'bold' }}>{v.vehicle_no}</td>
                <td>{v.vehicle_type}</td>
                <td><span className="badge">{v.mode}</span></td>
                <td>{v.customer_name || '-'}</td>
                <td>{v.supervisor_username.toUpperCase()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditingVehicle(v)}
                      className="badge badge-info" 
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <form action={deleteVehicle}>
                      <input type="hidden" name="id" value={v.id} />
                      <button type="submit" className="badge badge-danger" style={{ border: 'none', cursor: 'pointer' }}>Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No vehicles match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingVehicle && (
        <EditModal 
          vehicle={editingVehicle} 
          supervisors={supervisors} 
          onClose={() => setEditingVehicle(null)} 
        />
      )}
    </>
  );
}
