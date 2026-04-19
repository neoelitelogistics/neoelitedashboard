import './globals.css';

export const metadata = {
  title: 'Fleet Management System',
  description: 'Manage your vehicle fleet daily status and operations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            NeoFleet
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/login" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>Switch Role</a>
          </div>
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
