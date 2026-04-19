'use client';
import { useState } from 'react';
import { updateVehicle } from './actions';

export default function EditModal({ vehicle, supervisors, onClose }) {
  const [mode, setMode] = useState(vehicle.mode);
  const [customer, setCustomer] = useState(vehicle.customer_name || '');
  const [supervisor, setSupervisor] = useState(vehicle.supervisor_username);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updateVehicle(vehicle.id, mode, customer, supervisor);
    setIsSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Edit Vehicle: {vehicle.vehicle_no}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Mode</label>
            <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value)} required>
              <option value="Line">Line</option>
              <option value="Dedicated">Dedicated</option>
            </select>
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="input-group">
            <label>Supervisor</label>
            <select className="input-field" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required>
              {supervisors.map(s => (
                <option key={s.id} value={s.username}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--bg-input)' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
