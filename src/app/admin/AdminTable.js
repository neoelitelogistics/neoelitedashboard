'use client';
import { useState } from 'react';
import EditModal from './EditModal';
import { deleteVehicle } from './actions';

export default function AdminTable({ vehicles, supervisors }) {
  const [editingVehicle, setEditingVehicle] = useState(null);

  return (
    <>
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
            {vehicles.map(v => (
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
