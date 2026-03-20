export const metadata = { title: "Microservices Demo", description: "Microservices demo" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, background: '#f5f7fb' }}>
        <nav style={{ padding: 16, background: '#111827', color: 'white', display: 'flex', gap: 16 }}>
          <a href="/" style={{ color: 'white' }}>Home</a>
          <a href="/login" style={{ color: 'white' }}>Login</a>
          <a href="/register" style={{ color: 'white' }}>Register</a>
          <a href="/dashboard" style={{ color: 'white' }}>Dashboard</a>
          <a href="/products" style={{ color: 'white' }}>Products</a>
          <a href="/orders" style={{ color: 'white' }}>Orders</a>
          <a href="/admin" style={{ color: 'white' }}>Admin</a>
        </nav>
        <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
