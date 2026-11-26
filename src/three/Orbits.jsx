import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

const CONICS = [
  { key: 'circle',    e: 0.0, label: 'e = 0',   color: '#4ea8de', maxTheta: Math.PI,        speed: 0.55 },
  { key: 'ellipse1',  e: 0.4, label: 'e = 0.4', color: '#4ecdc4', maxTheta: Math.PI,        speed: 0.42 },
  { key: 'ellipse2',  e: 0.7, label: 'e = 0.7', color: '#7bc950', maxTheta: Math.PI,        speed: 0.30 },
  { key: 'ellipse3',  e: 0.9, label: 'e = 0.9', color: '#e8c547', maxTheta: Math.PI,        speed: 0.20 },
  { key: 'parabola',  e: 1.0, label: 'e = 1',   color: '#e05a47', maxTheta: Math.PI * 0.88, dotMaxTheta: Math.PI * 0.76, speed: 0.22 },
  { key: 'hyperbola', e: 1.6, label: 'e = 1.6', color: '#8b5fbf', maxTheta: Math.PI * 0.695, dotMaxTheta: Math.PI * 0.59, speed: 0.18 },
]

function conicPoint(e, theta, center, p) {
  const r = p / (1 + e * Math.cos(theta))
  return new THREE.Vector3(
    center.x + r * Math.cos(theta),
    center.y,
    center.z - r * Math.sin(theta)
  )
}

// Lapisan bintang ekstra yang hanya muncul aktif di section /writing
function WritingStarfield() {
  const dimRef = useRef()
  const brightRef = useRef()

  const { dimGeo, brightGeo } = useMemo(() => {
    const makeStars = (count, spreadX, spreadZ, minY, maxY) => {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spreadX
        positions[i * 3 + 1] = minY + Math.random() * (maxY - minY)
        positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      return g
    }

    return {
      dimGeo: makeStars(1500, 84, 52, -2.5, 6),
      brightGeo: makeStars(340, 78, 48, -1.5, 8),
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (dimRef.current) {
      dimRef.current.material.opacity = 0.62 + Math.sin(t * 0.9) * 0.08
    }
    if (brightRef.current) {
      brightRef.current.material.opacity = 0.85 + Math.cos(t * 1.3) * 0.1
    }
  })

  return (
    <group>
      <points ref={dimRef} geometry={dimGeo}>
        <pointsMaterial
          size={0.048}
          color="#cfd6e6"
          transparent
          opacity={0.65}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <points ref={brightRef} geometry={brightGeo}>
        <pointsMaterial
          size={0.095}
          color="#ffffff"
          transparent
          opacity={0.88}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function PlanetMesh({ position, radius }) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#19355c'
    ctx.fillRect(0, 0, 256, 128)

    const blobs = [
      [58, 44, 24, '#567563'], [76, 68, 19, '#75826e'], [134, 40, 28, '#5c7866'],
      [152, 70, 21, '#7f8975'], [206, 54, 22, '#557161'], [114, 94, 30, '#939ca4'],
    ]
    blobs.forEach(([x, y, r, color]) => {
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r)
      grad.addColorStop(0, color)
      grad.addColorStop(1, 'rgba(25,53,92,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = 'rgba(240, 246, 255, 0.28)'
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 37) % 240, (i * 19) % 115, 26, 4)
    }

    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2 + 0.3, 0.6, 0.2]}>
        <sphereGeometry args={[radius, 36, 36]} />
        <meshStandardMaterial map={tex} roughness={0.58} metalness={0.08} />
      </mesh>
    </group>
  )
}

function AnimatedConic({ config, revealRef, index, center, p, isMobile }) {
  const SEGMENTS = 320
  const dotRef = useRef()

  const { lineObj, labelPos } = useMemo(() => {
    const pts = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const u = (i / SEGMENTS) * 2 - 1
      const theta = u * config.maxTheta
      pts.push(conicPoint(config.e, theta, center, p))
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    geo.setDrawRange(0, 0)

    const mat = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.85,
    })

    const labelAngles = {
      0.0: Math.PI * 0.72,
      0.4: Math.PI * 0.78,
      0.7: isMobile ? Math.PI * 0.84 : Math.PI * 0.93,
      0.9: -Math.PI * 0.87,
      1.0: -Math.PI * 0.65,
      1.6: -Math.PI * 0.56,
    }
    const pos = conicPoint(config.e, labelAngles[config.e] ?? Math.PI * 0.7, center, p)

    return {
      lineObj: new THREE.Line(geo, mat),
      labelPos: pos,
    }
  }, [config, center, p, isMobile])

  useFrame(({ clock }) => {
    const prog = revealRef.current
    const half = Math.floor(SEGMENTS / 2)
    const span = Math.floor(half * prog)
    const start = Math.max(0, half - span)
    const count = Math.min(SEGMENTS + 1 - start, span * 2 + 1)
    lineObj.geometry.setDrawRange(start, count)

    if (dotRef.current) {
      if (prog < 0.25) {
        dotRef.current.visible = false
      } else {
        dotRef.current.visible = true
        const t = clock.elapsedTime * config.speed + index * 1.15
        let theta
        if (config.e < 1) {
          theta = t % (Math.PI * 2)
        } else {
          const swingLimit = config.dotMaxTheta ?? config.maxTheta * 0.85
          theta = Math.sin(t * 0.75) * swingLimit
        }
        dotRef.current.position.copy(conicPoint(config.e, theta, center, p))
      }
    }
  })

  return (
    <group>
      <primitive object={lineObj} />

      <mesh ref={dotRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[isMobile ? 0.12 : 0.18, 16]} />
        <meshBasicMaterial color={config.color} />
      </mesh>

      <Html position={[labelPos.x - (isMobile ? 0.35 : 0.6), 0.05, labelPos.z]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color: config.color,
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: isMobile ? '9px' : '11px',
            whiteSpace: 'nowrap',
            opacity: 0.92,
          }}
        >
          {config.label}
        </div>
      </Html>
    </group>
  )
}

function FormulaHUD({ isMobile }) {
  const legend = [
    { eq: 'e = 0',     name: 'circle',    color: '#4ea8de' },
    { eq: '0 < e < 1', name: 'ellipse',   color: '#6dc7b8' },
    { eq: 'e = 1',     name: 'parabola',  color: '#e05a47' },
    { eq: 'e > 1',     name: 'hyperbola', color: '#8b5fbf' },
  ]

  const wrapperStyle = isMobile
    ? {
        position: 'fixed',
        left: 0,
        top: 'calc(100dvh - 185px)',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        color: '#e6e4de',
        fontFamily: 'var(--serif)',
        whiteSpace: 'nowrap',
      }
    : {
        position: 'fixed',
        left: 'clamp(28px, 12vw, 190px)',
        top: '36vh',
        color: '#e6e4de',
        fontFamily: 'var(--serif)',
        whiteSpace: 'nowrap',
      }

  return (
    <Html fullscreen calculatePosition={() => [0, 0]} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
      <div style={wrapperStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '17px' : '23px' }}>
            <span style={{ fontStyle: 'italic' }}>r</span>
            <span style={{ color: '#a5a7ad', fontSize: isMobile ? '14px' : '17px' }}>=</span>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ padding: '0 8px 3px', borderBottom: '1px solid rgba(235,229,216,0.45)' }}>
                <i style={{ fontStyle: 'italic' }}>h</i>
                <sup style={{ fontSize: isMobile ? '10px' : '12px' }}>2</sup>
              </span>
              <span style={{ paddingTop: '3px', fontSize: isMobile ? '15.5px' : '20px' }}>
                <i style={{ fontStyle: 'italic' }}>GM</i> (1 + <i style={{ fontStyle: 'italic' }}>e</i> cos <i style={{ fontStyle: 'italic' }}>θ</i>)
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: isMobile ? '10px' : '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '3px' : '5px',
              fontFamily: 'var(--serif)',
              fontSize: isMobile ? '10.5px' : '12px',
            }}
          >
            {legend.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: item.color, width: '54px', textAlign: 'right', fontStyle: 'italic' }}>
                  {item.eq}
                </span>
                <span style={{ color: '#8f9298' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: isMobile ? '20px' : '28px',
          top: isMobile ? 'calc(100dvh - 28px)' : 'calc(100vh - 34px)',
          color: '#74787c',
          fontSize: '8.5px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Orbits of Different Conic Sections
      </div>
    </Html>
  )
}

export default function Orbits({ active }) {
  const revealRef = useRef(0)
  const width = useThree((s) => s.size.width)
  const isMobile = width < 768

  const planetPos = useMemo(
    () => (isMobile ? new THREE.Vector3(3.1, 0, -1.5) : new THREE.Vector3(13.5, 0, 0)),
    [isMobile]
  )
  const pVal = isMobile ? 2.25 : 6.4

  useEffect(() => {
    if (active) revealRef.current = 0
  }, [active])

  useFrame((_, dt) => {
    if (active && revealRef.current < 1) {
      revealRef.current = Math.min(1, revealRef.current + dt * 0.65)
    }
  })

  const topNode = useMemo(() => conicPoint(0, Math.PI / 2, planetPos, pVal), [planetPos, pVal])

  return (
    <group>
      <ambientLight intensity={1.05} />
      <directionalLight position={[14, 24, 12]} intensity={2.1} color="#fff9f0" />

      {active && <WritingStarfield />}

      <Line
        points={[[-60, 0.01, planetPos.z], [60, 0.01, planetPos.z]]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={0.14}
      />
      <Line
        points={[[planetPos.x, 0.01, -40], [planetPos.x, 0.01, 40]]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={0.14}
      />

      <PlanetMesh position={planetPos} radius={isMobile ? 0.72 : 1.05} />

      <Line
        points={[planetPos.toArray(), topNode.toArray()]}
        color="#ffffff"
        lineWidth={1}
        dashed
        dashSize={0.3}
        gapSize={0.25}
        transparent
        opacity={0.38}
      />

      <mesh position={[topNode.x, 0.02, topNode.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isMobile ? 0.11 : 0.16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {active && (
        <Html
          position={[planetPos.x - (isMobile ? 0.95 : 1.55), 0.05, (planetPos.z + topNode.z) * 0.5]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#c8c7c2',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: isMobile ? '10.5px' : '13px',
              whiteSpace: 'nowrap',
            }}
          >
            h²/GM
          </div>
        </Html>
      )}

      {CONICS.map((cfg, idx) => (
        <AnimatedConic
          key={`${cfg.key}-${isMobile ? 'm' : 'd'}`}
          config={cfg}
          revealRef={revealRef}
          index={idx}
          center={planetPos}
          p={pVal}
          isMobile={isMobile}
        />
      ))}

      {active && <FormulaHUD isMobile={isMobile} />}
    </group>
  )
}