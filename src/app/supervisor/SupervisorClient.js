'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bulkUpdateVehicles } from './actions';
import DateFilter from '@/components/DateFilter';

const statusOptions = [
  'Idle - Waiting for load',
  'Idle - Waiting for Unload',
  'In Transit',
  'In Loading Process',
  'In Unloading Process',
  'Breakdown',
  'No Driver',
  'Driver Absent',
  'Issue With Driver',
  'Service Center',
  'Accident',
  'Driver on the Way',
];

const quickStatusOptions = [
  'In Transit',
  'Idle - Waiting for load',
  'In Loading Process',
  'Breakdown',
  'Service Center',
];

const locationRequiredStatuses = new Set([
  'Breakdown',
  'Service Center',
  'Accident',
  'Driver Absent',
  'Issue With Driver',
]);

const locationPresets = [
  'Plant',
  'Customer Site',
  'On Route',
  'Yard',
  'Service Center',
  'Fuel Station',
];

const idleStatuses = new Set([
  'Idle - Waiting for load',
  'Breakdown',
  'No Driver',
  'Driver Absent',
  'Issue With Driver',
  'Service Center',
  'Accident',
  'Driver on the Way',
]);

function formatUpdateTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupervisorClient({ vehicles, user, selectedDate }) {
  const router = useRouter();
  const [selectedTrucks, setSelectedTrucks] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Idle - Waiting for load');
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const requiresLocation = locationRequiredStatuses.has(status);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vehicle.customer_name &&
            vehicle.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [searchQuery, vehicles]
  );

  const updatedTodayCount = vehicles.filter((vehicle) => vehicle.current_status).length;
  const pendingTodayCount = vehicles.length - updatedTodayCount;
  const completionPercentage = vehicles.length
    ? Math.round((updatedTodayCount / vehicles.length) * 100)
    : 0;

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
    if (selectedTrucks.size === filteredVehicles.length && filteredVehicles.length > 0) {
      setSelectedTrucks(new Set());
    } else {
      setSelectedTrucks(new Set(filteredVehicles.map((vehicle) => vehicle.truck_id)));
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsUpdating(true);

    try {
      await bulkUpdateVehicles(
        Array.from(selectedTrucks),
        customerName,
        location,
        status,
        selectedDate
      );
      setIsUpdating(false);
      setShowModal(false);
      setSelectedTrucks(new Set());
      setLocation('');
      setCustomerName('');
      router.refresh();
    } catch (error) {
      setIsUpdating(false);
      setErrorMessage(error.message || 'Unable to update the selected vehicles.');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Portal: {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Status for {selectedDate}
          </p>
          <DateFilter initialDate={selectedDate} baseUrl="/supervisor" />
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            Assigned Fleet
          </div>
          <div
            style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: 'var(--accent-primary)',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            {vehicles.length}
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {updatedTodayCount} updated, {pendingTodayCount} pending
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            End-of-Day Completion
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            {completionPercentage}%
          </div>
          <div
            style={{
              height: '10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--border-light)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${completionPercentage}%`,
                height: '100%',
                backgroundColor: completionPercentage === 100 ? 'var(--success)' : 'var(--accent-primary)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label htmlFor="supervisor-search">Search Assigned Vehicles</label>
          <input
            id="supervisor-search"
            type="text"
            placeholder="Search by Vehicle No or Customer..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          className="btn"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            minHeight: '48px',
            paddingInline: '1rem',
          }}
          onClick={toggleSelectAll}
        >
          {selectedTrucks.size === filteredVehicles.length && filteredVehicles.length > 0
            ? 'Deselect Visible'
            : 'Select Visible'}
        </button>
        <span style={{ color: 'var(--text-secondary)' }}>
          {selectedTrucks.size} selected
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          paddingBottom: '96px',
        }}
      >
        {filteredVehicles.map((vehicle) => {
          const isSelected = selectedTrucks.has(vehicle.truck_id);
          const isIdle = idleStatuses.has(vehicle.current_status);
          const statusColor = vehicle.current_status
            ? isIdle
              ? 'var(--danger)'
              : 'var(--success)'
            : 'var(--warning)';
          const isUpdated = Boolean(vehicle.current_status);
          const updatedByYou = vehicle.current_last_updated_by === user.username;
          const lastUpdatedLabel = formatUpdateTime(vehicle.current_last_updated_at);

          return (
            <button
              key={vehicle.truck_id}
              type="button"
              className={`glass-card ${isSelected ? 'selected-card' : ''}`}
              onClick={() => toggleSelect(vehicle.truck_id)}
              style={{
                textAlign: 'left',
                border: isSelected
                  ? '2px solid var(--accent-primary)'
                  : isUpdated
                    ? '1px solid var(--border-color)'
                    : '2px solid var(--warning)',
                padding: '1rem',
                backgroundColor: isSelected ? '#eff6ff' : isUpdated ? 'white' : '#fffbeb',
                minHeight: '180px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                  {vehicle.vehicle_no}
                </div>
                {!isUpdated && <span className="badge badge-warning">Pending</span>}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {vehicle.customer_name || 'No Customer'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.9rem' }}>
                <span style={{ color: statusColor, fontWeight: '700' }}>
                  {vehicle.current_status || 'Not updated today'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Location: {vehicle.current_location || 'Add current location'}
                </span>
                {updatedByYou && lastUpdatedLabel && (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                    Last updated by you on {lastUpdatedLabel}
                  </span>
                )}
                {!updatedByYou && lastUpdatedLabel && vehicle.current_last_updated_by && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Updated by {vehicle.current_last_updated_by.toUpperCase()} on {lastUpdatedLabel}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {vehicles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No vehicles assigned to you.
          </div>
        )}
      </div>

      {selectedTrucks.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            width: '92%',
            maxWidth: '420px',
          }}
        >
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '58px',
              fontSize: '1.05rem',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
            }}
            onClick={() => setShowModal(true)}
          >
            Update {selectedTrucks.size} Vehicles
          </button>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '1.5rem',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0 }}>Bulk Update ({selectedTrucks.size})</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleBulkUpdate}>
              <div className="input-group">
                <label>Quick Status</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {quickStatusOptions.map((quickStatus) => (
                    <button
                      key={quickStatus}
                      type="button"
                      className="btn"
                      onClick={() => setStatus(quickStatus)}
                      style={{
                        backgroundColor: status === quickStatus ? '#dbeafe' : 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        minHeight: '44px',
                      }}
                    >
                      {quickStatus}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Status</label>
                <select
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  style={{ minHeight: '48px' }}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} {idleStatuses.has(option) ? '(Idle)' : '(Active)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>
                  Current Location {requiresLocation ? '(Required for this status)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={requiresLocation ? 'Enter current location' : 'Leave blank if unchanged'}
                  required={requiresLocation}
                  style={{ minHeight: '48px' }}
                />
              </div>

              <div className="input-group">
                <label>Quick Location</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {locationPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn"
                      onClick={() => setLocation(preset)}
                      style={{
                        backgroundColor: location === preset ? '#dbeafe' : 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        minHeight: '44px',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Customer Name (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Leave blank to keep existing"
                  style={{ minHeight: '48px' }}
                />
              </div>

              {errorMessage && (
                <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{errorMessage}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', minHeight: '52px', fontSize: '1rem' }}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Apply Status'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `,
        }}
      />
    </div>
  );
}
