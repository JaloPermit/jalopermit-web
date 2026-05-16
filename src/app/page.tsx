'use client'

import { useState } from 'react'

const HARD_CODED_USER = {
  email: 'admin@jalopermit.com',
  password: 'Jalo@1234',
  name: 'Jalo Admin',
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<null | { name: string; email: string }>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Simulated DB lookup (single seeded user)
    if (
      email.trim().toLowerCase() === HARD_CODED_USER.email &&
      password === HARD_CODED_USER.password
    ) {
      setUser({ name: HARD_CODED_USER.name, email: HARD_CODED_USER.email })
      return
    }

    setError('Invalid credentials')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundImage:
          "linear-gradient(rgba(8,16,30,.62), rgba(8,16,30,.62)), url('/hero-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 'min(440px, 100%)',
          borderRadius: 20,
          padding: 28,
          background: 'rgba(11,18,32,0.72)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 18px 45px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
            }}
          >
            JP
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>JaloPermit</div>
            <div style={{ opacity: 0.82, fontSize: 13 }}>OS/OW Permit Platform</div>
          </div>
        </div>

        {!user ? (
          <>
            <h1 style={{ margin: '4px 0 6px', fontSize: 28 }}>Sign in</h1>
            <p style={{ marginTop: 0, opacity: 0.88 }}>Authorized access only</p>

            <form onSubmit={onSubmit}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                style={inputStyle}
                placeholder="admin@jalopermit.com"
              />

              <label style={{ display: 'block', marginBottom: 8, marginTop: 14, fontSize: 13 }}>
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                style={inputStyle}
                placeholder="••••••••"
              />

              {error && <p style={{ color: '#fda4af', marginTop: 12 }}>{error}</p>}

              <button type="submit" style={btnStyle}>
                Sign In
              </button>
            </form>
          </>
        ) : (
          <div>
            <h2 style={{ marginTop: 10, fontSize: 26 }}>Welcome, {user.name}</h2>
            <p style={{ opacity: 0.9 }}>Authenticated as {user.email}</p>
          </div>
        )}
      </div>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  marginTop: 16,
  width: '100%',
  padding: '12px 14px',
  border: 'none',
  borderRadius: 12,
  background: '#dc2626',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}
