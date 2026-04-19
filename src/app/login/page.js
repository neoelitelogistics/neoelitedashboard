import { loginAs } from './actions';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const db = await getDb();
  const users = await db.all('SELECT * FROM Users ORDER BY role ASC, name ASC');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2>Login to NeoFleet</h2>
        <p style={{ marginBottom: '2rem' }}>Select your account to continue</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users.map(user => {
            // Using bind to pass arguments to the server action
            const loginAction = loginAs.bind(null, user.username, user.role);
            
            return (
              <form key={user.id} action={loginAction}>
                <button 
                  type="submit"
                  className={user.role === 'Admin' ? 'btn btn-primary' : 'btn'} 
                  style={{ 
                    width: '100%', 
                    padding: '1rem',
                    backgroundColor: user.role === 'Admin' ? '' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '0.5rem'
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
  );
}
