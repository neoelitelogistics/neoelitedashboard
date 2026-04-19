'use client';
import { useState } from 'react';
import { bulkUpdateVehicles } from './actions';

export default function SupervisorClient({ vehicles, user }) {
  const [selectedTrucks, setSelectedTrucks] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Idle - Waiting for load');
  const [customerName, setCustomerName] = useState('');

  const toggleSelect = (truckId) => {
    const newSet = new Set(selectedTrucks);
    if (newSet.has(truckId)) {
      newSet.delete(truckId);
    } else {
      newSet.add(truckId);
    }
    setSelectedTrucks(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedTrucks.size === vehicles.length) {
      setSelectedTrucks(newSet());
    } else {
      setSelectedTrucks(new Set(vehicles.map(v => v.truck_id)));
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await bulkUpdateVehicles(Array.from(selectedTrucks), customerName, location, status);
    setIsUpdating(false);
    setShowModal(false);
    setSelectedTrucks(new Set()); // Reset selection after update
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Portal: {user.name}</h1>
          <div className="badge badge-info">Assigned Fleet: {vehicles.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={toggleSelectAll}>
          {selectedTrucks.size === vehicles.length ? 'Deselect All' : 'Select All'}
        </button>
        <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>
          {selectedTrucks.size} selected
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', paddingBottom: '80px' }}>
        {vehicles.map(vehicle => {
          const isSelected = selectedTrucks.has(vehicle.truck_id);
          const idleStatuses = [
            'Idle - Waiting for load', 'Breakdown', 'No Driver', 
            'Driver Absent', 'Issue With Driver', 'Service Center', 
            'Accident', 'Driver on the Way'
          ];
          const isIdle = idleStatuses.includes(vehicle.current_status);
          const statusColor = vehicle.current_status ? (isIdle ? 'var(--danger)' : 'var(--success)') : 'var(--text-secondary)';

          return (
            <div 
              key={vehicle.truck_id} 
              className={`glass-card ${isSelected ? 'selected-card' : ''}`}
              onClick={() => toggleSelect(vehicle.truck_id)}
              style={{ 
                cursor: 'pointer', 
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.7)'
              }}
            >
              <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                {vehicle.vehicle_no}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {vehicle.customer_name || 'No Customer'}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                <span style={{ color: statusColor, fontWeight: '600' }}>
                  {vehicle.current_status || 'No Status'}
                </span>
                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  📍 {vehicle.current_location || 'Unknown'}
                </span>
              </div>
            </div>
          );
        })}

        {vehicles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No vehicles assigned to you.
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {selectedTrucks.size > 0 && (
        <div style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: '90%',
          maxWidth: '400px'
        }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)' }}
            onClick={() => setShowModal(true)}
          >
            Update {selectedTrucks.size} Vehicles
          </button>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ 
            width: '100%', maxWidth: '500px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            padding: '2rem', animation: 'slideUp 0.3s ease-out' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Bulk Update ({selectedTrucks.size})</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleBulkUpdate}>
              <div className="input-group">
                <label>Customer Name (Optional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Leave blank to keep existing"
                />
              </div>

              <div className="input-group">
                <label>Current Location</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Status</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="Idle - Waiting for load">Idle - Waiting for load (Idle)</option>
                  <option value="Idle - Waiting for Unload">Idle - Waiting for Unload (Active)</option>
                  <option value="In Transit">In Transit (Active)</option>
                  <option value="In Loading Process">In Loading Process (Active)</option>
                  <option value="In Unloading Process">In Unloading Process (Active)</option>
                  <option value="Breakdown">Breakdown (Idle)</option>
                  <option value="No Driver">No Driver (Idle)</option>
                  <option value="Driver Absent">Driver Absent (Idle)</option>
                  <option value="Issue With Driver">Issue With Driver (Idle)</option>
                  <option value="Service Center">Service Center (Idle)</option>
                  <option value="Accident">Accident (Idle)</option>
                  <option value="Driver on the Way">Driver on the Way (Idle)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Apply Status'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
