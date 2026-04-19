'use client';

import { useActionState } from 'react';
import { loginManagement } from './actions';

const initialState = {
  message: '',
};

export default function ManagementLoginForm() {
  const [state, formAction, pending] = useActionState(loginManagement, initialState);

  return (
    <form action={formAction} className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Management Login</h3>
      <p style={{ marginBottom: '1.5rem' }}>Use the management username and password to access the dashboard.</p>

      <div className="input-group">
        <label htmlFor="management-username">Username</label>
        <input
          id="management-username"
          name="username"
          type="text"
          className="input-field"
          placeholder="Enter username"
          autoComplete="username"
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="management-password">Password</label>
        <input
          id="management-password"
          name="password"
          type="password"
          className="input-field"
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.message ? (
        <p
          aria-live="polite"
          style={{
            color: 'var(--danger)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {state.message}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={pending}>
        {pending ? 'Signing in...' : 'Login as Management'}
      </button>
    </form>
  );
}
