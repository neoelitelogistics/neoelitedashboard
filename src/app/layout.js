import './globals.css';

export const metadata = {
  title: 'Neo Elite Logistics Private Limited',
  description: 'Manage your vehicle fleet daily status and operations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ 
          padding: '1rem 2rem', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'white',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Neo Elite Logistics Private Limited
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/login" className="btn" style={{ fontSize: '0.875rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>Logout / Switch</a>
          </div>
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
