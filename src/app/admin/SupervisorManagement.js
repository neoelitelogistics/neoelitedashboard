'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { addSupervisor, deleteSupervisor, updateSupervisor } from './actions';

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

const initialActionState = { ok: null, message: '' };

function suggestUsernameFromName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function SupervisorEditModal({ supervisor, existingUsernames, onClose }) {
  const [name, setName] = useState(supervisor.name);
  const [username, setUsername] = useState(supervisor.username);
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const [editState, editAction, isPending] = useActionState(updateSupervisor, initialActionState);

  useEffect(() => {
    if (!hasEditedUsername) {
      setUsername(suggestUsernameFromName(name));
    }
  }, [name, hasEditedUsername]);

  useEffect(() => {
    if (editState.ok) {
      onClose();
    }
  }, [editState, onClose]);

  const normalizedUsername = username.trim().toLowerCase();
  const usernameFormatValid = USERNAME_PATTERN.test(normalizedUsername);
  const hasDuplicate = useMemo(() => {
    const current = supervisor.username.toLowerCase();
    return existingUsernames
      .map((value) => value.toLowerCase())
      .some((value) => value !== current && value === normalizedUsername);
  }, [existingUsernames, normalizedUsername, supervisor.username]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Edit Supervisor</h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>&times;</button>
        </div>

        <form action={editAction}>
          <input type="hidden" name="id" value={supervisor.id} />

          <div className="input-group">
            <label htmlFor={`edit-supervisor-name-${supervisor.id}`}>Name</label>
            <input
              id={`edit-supervisor-name-${supervisor.id}`}
              type="text"
              name="name"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor={`edit-supervisor-username-${supervisor.id}`}>Username</label>
            <input
              id={`edit-supervisor-username-${supervisor.id}`}
              type="text"
              name="username"
              className="input-field"
              value={username}
              onChange={(event) => {
                setHasEditedUsername(true);
                setUsername(event.target.value.toLowerCase());
              }}
              pattern="[a-z0-9_]+"
              required
            />
            {!usernameFormatValid && normalizedUsername && (
              <p style={{ color: '#ff6b6b', marginTop: '0.5rem', marginBottom: 0 }}>
                Username can contain only lowercase letters, numbers, and underscores.
              </p>
            )}
            {hasDuplicate && (
              <p style={{ color: '#ff6b6b', marginTop: '0.5rem', marginBottom: 0 }}>
                Username already exists.
              </p>
            )}
          </div>

          {editState.message && (
            <p style={{ color: editState.ok ? '#4caf50' : '#ff6b6b', marginBottom: 0 }}>{editState.message}</p>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--bg-input)' }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={isPending || !usernameFormatValid || hasDuplicate}
            >
              {isPending ? 'Saving...' : 'Update Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SupervisorManagement({ supervisors }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [addState, addAction, addPending] = useActionState(addSupervisor, initialActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSupervisor, initialActionState);

  useEffect(() => {
    if (!hasEditedUsername) {
      setUsername(suggestUsernameFromName(name));
    }
  }, [name, hasEditedUsername]);

  useEffect(() => {
    if (addState.ok) {
      setName('');
      setUsername('');
      setHasEditedUsername(false);
    }
  }, [addState]);

  const existingUsernames = useMemo(
    () => supervisors.map((supervisor) => String(supervisor.username || '').toLowerCase()),
    [supervisors]
  );

  const normalizedUsername = username.trim().toLowerCase();
  const usernameFormatValid = USERNAME_PATTERN.test(normalizedUsername);
  const usernameExists = existingUsernames.includes(normalizedUsername);

  return (
    <>
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3>Add Supervisor</h3>
        <form action={addAction} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-supervisor-name">Name</label>
            <input
              id="admin-add-supervisor-name"
              type="text"
              name="name"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label htmlFor="admin-add-supervisor-username">Username</label>
            <input
              id="admin-add-supervisor-username"
              type="text"
              name="username"
              className="input-field"
              value={username}
              onChange={(event) => {
                setHasEditedUsername(true);
                setUsername(event.target.value.toLowerCase());
              }}
              pattern="[a-z0-9_]+"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1rem' }}
            disabled={addPending || !usernameFormatValid || usernameExists}
          >
            {addPending ? 'Adding...' : 'Add Supervisor'}
          </button>
        </form>

        {!usernameFormatValid && normalizedUsername && (
          <p style={{ color: '#ff6b6b', marginTop: '0.75rem', marginBottom: 0 }}>
            Username can contain only lowercase letters, numbers, and underscores.
          </p>
        )}
        {usernameExists && (
          <p style={{ color: '#ff6b6b', marginTop: '0.75rem', marginBottom: 0 }}>
            Username already exists.
          </p>
        )}
        {addState.message && (
          <p style={{ color: addState.ok ? '#4caf50' : '#ff6b6b', marginTop: '0.75rem', marginBottom: 0 }}>
            {addState.message}
          </p>
        )}
      </div>

      <div className="table-container" style={{ marginBottom: '2.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Assigned Vehicles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {supervisors.map((supervisor) => {
              const assignedVehicles = Number(supervisor.assigned_vehicles_count || 0);

              return (
                <tr key={supervisor.id}>
                  <td>{supervisor.id}</td>
                  <td>{supervisor.name}</td>
                  <td>{supervisor.username}</td>
                  <td>{assignedVehicles}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setEditingSupervisor(supervisor)}
                        className="badge badge-info"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <form
                        action={deleteAction}
                        onSubmit={(event) => {
                          if (assignedVehicles > 0) {
                            event.preventDefault();
                            window.alert(
                              `Cannot delete ${supervisor.name}. Reassign ${assignedVehicles} assigned vehicle(s) in Vehicle Master below, then try again.`
                            );
                            return;
                          }
                          const confirmed = window.confirm(`Delete supervisor "${supervisor.name}"?`);
                          if (!confirmed) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={supervisor.id} />
                        <input type="hidden" name="confirm_delete" value="yes" />
                        <button
                          type="submit"
                          className="badge badge-danger"
                          style={{ border: 'none', cursor: 'pointer' }}
                          disabled={deletePending}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {supervisors.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                  No supervisors available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteState.message && (
        <p style={{ color: deleteState.ok ? '#4caf50' : '#ff6b6b', marginBottom: '1.5rem' }}>
          {deleteState.message}
        </p>
      )}

      {editingSupervisor && (
        <SupervisorEditModal
          supervisor={editingSupervisor}
          existingUsernames={existingUsernames}
          onClose={() => setEditingSupervisor(null)}
        />
      )}
    </>
  );
}
