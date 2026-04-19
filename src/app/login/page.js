import { loginAs } from './actions';
import { getDb } from '@/lib/db';
import ManagementLoginForm from './ManagementLoginForm';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const db = await getDb();
  const users = await db.all('SELECT * FROM Users ORDER BY role ASC, name ASC');
  const supervisorUsers = users.filter((user) => user.role !== 'Admin');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Neo Elite Logistics Private Limited</h2>
          <p>Management uses credentials. Supervisors can continue with one-tap login.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          <ManagementLoginForm />

          <div className="glass-card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Supervisor Login</h3>
            <p style={{ marginBottom: '1.5rem' }}>Select your account to continue.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {supervisorUsers.map((user) => {
                const loginAction = loginAs.bind(null, user.username, user.role);

                return (
                  <form key={user.id} action={loginAction}>
                    <button
                      type="submit"
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                      }}
                    >
                      Login as {user.name} ({user.role})
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
