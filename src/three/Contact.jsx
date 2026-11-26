import { useState } from 'react'

export function Contact() {
  const [status, setStatus] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('Message sent successfully!')
  }

  return (
    <>
      <header className="page-head">
        <h1>contact</h1>
        <p className="sub">lets build something stellar together. drop a message below!!</p>
      </header>

      <div className="wall" style={{ maxWidth: '480px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#8f9298', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="Arya"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '10px 14px',
                color: '#f0ede6',
                fontFamily: 'var(--sans)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#8f9298', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="arya@example.com"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '10px 14px',
                color: '#f0ede6',
                fontFamily: 'var(--sans)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: '#8f9298', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Message
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell me about your project..."
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                padding: '10px 14px',
                color: '#f0ede6',
                fontFamily: 'var(--sans)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: '#f0ede6',
              color: '#0d0d12',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 20px',
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '6px',
              transition: 'opacity 0.2s',
            }}
          >
            Send Transmission ↗
          </button>

          {status && (
            <p style={{ color: '#4ecdc4', fontSize: '12px', marginTop: '4px', fontFamily: 'var(--serif)' }}>
              {status}
            </p>
          )}
        </form>
      </div>
    </>
  )
}