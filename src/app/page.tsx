'use client'

import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://jalopermit-api-dev.onrender.com'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<null | { name: string; email: string }>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Login failed')
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={mainStyle}>
      <section style={heroStyle}>
        <div style={panelWrapStyle}>
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={iconBoxStyle}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                  <circle cx="17" cy="18" r="2"/>
                  <circle cx="7" cy="18" r="2"/>
                </svg>
              </span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>JaloPermit</div>
                
              </div>
            </div>

            {!user ? (
              <>
                <h1 style={{ margin: '2px 0 4px', fontSize: 28 }}>Sign in</h1>
                <p style={{ marginTop: 0, opacity: 0.88 }}>Authorized access only</p>

                <form onSubmit={onSubmit}>
                  <label style={labelStyle}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={inputStyle} placeholder="admin@jalopermit.com" />
                  <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={inputStyle} placeholder="••••••••" />
                  {error && <p style={{ color: '#fecaca', marginTop: 12 }}>{error}</p>}
                  <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                </form>
              </>
            ) : (
              <div>
                <h2 style={{ marginTop: 10, fontSize: 26 }}>Welcome, {user.name}</h2>
                <p style={{ opacity: 0.9 }}>Authenticated as {user.email}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

const mainStyle: React.CSSProperties = { width: '100vw', height: '100vh', overflow: 'hidden', margin: 0 }
const heroStyle: React.CSSProperties = {
  width: '100%', height: '100%',
  backgroundImage: "linear-gradient(rgba(8,16,30,.55), rgba(8,16,30,.55)), url('/hero-bg.jpg')",
  backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif',
}
const panelWrapStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-end',
  paddingRight: 'clamp(28px, 6vw, 110px)', alignItems: 'center', padding: 'clamp(12px, 3vw, 42px)' }
const panelStyle: React.CSSProperties = { width: 'min(430px, 100%)', borderRadius: 20, padding: 24, background: 'rgba(11,18,32,0.72)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', boxShadow: '0 18px 45px rgba(0,0,0,.35)' }
const iconBoxStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, background: '#dc2626', display: 'grid', placeItems: 'center', color: '#fff' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none' }
const btnStyle: React.CSSProperties = { marginTop: 16, width: '100%', padding: '12px 14px', border: 'none', borderRadius: 12, background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }
