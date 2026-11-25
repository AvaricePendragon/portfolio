import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Experience from './three/Experience'
import Nav from './components/Nav'
import { About, Projects, Writing, WritingPost, Cabinet } from './pages'

const Eye = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
)

export default function App() {
  const [hidden, setHidden] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'h' || e.key === 'H') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setHidden((h) => !h)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="canvas-layer">
        <Experience />
      </div>

      <div className="ambient-shade" aria-hidden="true" />

      <button
        className="eye-btn"
        onClick={() => setHidden((h) => !h)}
        title="Hide or show the interface (H)"
        aria-label={hidden ? 'Show interface' : 'Explore without interface'}
        aria-pressed={hidden}
      >
        {hidden ? <EyeOff /> : <Eye />}
        <span>{hidden ? 'Show interface' : 'Explore universe'}</span>
        <kbd>H</kbd>
      </button>

      <p className={`hint ${hidden ? 'show' : ''}`}>
        <span>Drag to orbit</span>
        <i aria-hidden="true" />
        <span>Scroll to zoom</span>
      </p>
      
      <main id="main-content" className={`content ${hidden ? 'hidden' : ''}`} aria-hidden={hidden}>
        <header className="site-header">
          <a className="identity" href="/" aria-label="Crescent — home">
            <span className="identity-mark" aria-hidden="true"><i /></span>
            <span>
              <strong>Crescent</strong>
              <small>Digital astronomer</small>
            </span>
          </a>
          <Nav />
        </header>
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="/writing/:slug" element={<WritingPost />} />
          <Route path="/cabinet" element={<Cabinet />} />
        </Routes>
      </main>
    </>
  )
}
