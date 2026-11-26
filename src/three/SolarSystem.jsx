import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import Glow from './Glow'

const PLANETS = [
  {
    name: 'MERCURY',
    radius: 0.24,
    distance: 4.4,
    speed: 0.26,
    phase: Math.PI * 0.94,
    colors: ['#8d8a84', '#5c5954', '#aba7a0'],
  },
  {
    name: 'VENUS',
    radius: 0.38,
    distance: 6.8,
    speed: 0.19,
    phase: Math.PI * 1.12,
    colors: ['#d9b37c', '#b58952', '#edd0a3'],
  },
  {
    name: 'EARTH',
    sub: 'OUR PLANET !!',
    home: true,
    radius: 0.44,
    distance: 9.6,
    speed: 0.15,
    phase: Math.PI * 0.86,
    colors: ['#1d4375', '#4f7a63', '#8ca39c'],
    moons: [{ radius: 0.11, distance: 0.95, speed: 1.4, color: '#cfd2d6' }],
  },
  {
    name: 'MARS',
    radius: 0.31,
    distance: 12.4,
    speed: 0.12,
    phase: Math.PI * 1.04,
    colors: ['#b8573b', '#873823', '#d97b5d'],
  },
  {
    name: 'JUPITER',
    radius: 1.05,
    distance: 18.8,
    speed: 0.075,
    phase: Math.PI * 0.92,
    colors: ['#c99e73', '#9c6e49', '#e3c6a6'],
    banded: true,
    moons: [
      { radius: 0.11, distance: 1.65, speed: 1.6, color: '#e6d3a7' },
      { radius: 0.13, distance: 2.05, speed: 1.1, color: '#c8c4bc' },
      { radius: 0.10, distance: 2.45, speed: 0.8, color: '#a89f94' },
    ],
  },
  {
    name: 'SATURN',
    radius: 0.86,
    distance: 24.8,
    speed: 0.055,
    phase: Math.PI * 1.09,
    colors: ['#d6bc8b', '#ad9263', '#ebd7b0'],
    banded: true,
    ring: { inner: 1.25, outer: 2.15, color: '#c4b08b', tilt: [1.18, 0.25, -0.2] },
    moons: [{ radius: 0.13, distance: 2.55, speed: 0.9, color: '#dfb87c' }],
  },
  {
    name: 'URANUS',
    radius: 0.62,
    distance: 30.2,
    speed: 0.04,
    phase: Math.PI * 0.82,
    colors: ['#8ecad6', '#67a5b3', '#bce5ed'],
    ring: { inner: 0.88, outer: 1.06, color: '#9ad0db', tilt: [0.4, 0.3, 1.35] },
  },
  {
    name: 'NEPTUNE',
    radius: 0.58,
    distance: 35.4,
    speed: 0.032,
    phase: Math.PI * 1.01,
    colors: ['#3b62b8', '#25438a', '#648ce0'],
  },
  {
    name: 'PLUTO',
    radius: 0.20,
    distance: 40.0,
    speed: 0.024,
    phase: Math.PI * 0.90,
    colors: ['#9c8b7e', '#6e6056', '#c4b4a7'],
  },
]

function createPlanetTexture(colors, banded = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, 256, 128)

  if (banded) {
    for (let y = 0; y < 128; y += 6) {
      ctx.fillStyle = y % 12 === 0 ? colors[1] : colors[2]
      ctx.globalAlpha = 0.38
      ctx.fillRect(0, y, 256, 4)
    }
    ctx.globalAlpha = 1
  } else {
    const spots = [
      [52, 40, 26, colors[1]],
      [115, 66, 32, colors[1]],
      [188, 46, 28, colors[2]],
      [82, 92, 24, colors[2]],
      [215, 88, 22, colors[1]],
    ]
    spots.forEach(([x, y, r, c]) => {
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r)
      grad.addColorStop(0, c)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// 1. Garis lintasan orbit lebih terang & tegas
function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = []
    const segs = 160
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius])
    }
    return pts
  }, [radius])

  return <Line points={points} color="#dce4f7" lineWidth={1.1} transparent opacity={0.32} />
}

// 2. Sabuk asteroid jauh lebih ramai dengan 2 lapisan ukuran batu & debu
function AsteroidBelt() {
  const fineRef = useRef()
  const chunkRef = useRef()

  const { fineGeo, chunkGeo } = useMemo(() => {
    const makeBelt = (count, minR, maxR, spreadY) => {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        // Distribusi lebih padat di tengah sabuk (sekitar radius 15.4)
        const t = (Math.random() + Math.random()) * 0.5
        const r = minR + t * (maxR - minR)
        positions[i * 3] = Math.cos(angle) * r
        positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY
        positions[i * 3 + 2] = Math.sin(angle) * r
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      return g
    }

    return {
      fineGeo: makeBelt(1100, 14.0, 16.8, 0.75),
      chunkGeo: makeBelt(380, 14.3, 16.5, 0.55),
    }
  }, [])

  useFrame((_, dt) => {
    if (fineRef.current) fineRef.current.rotation.y += dt * 0.032
    if (chunkRef.current) chunkRef.current.rotation.y += dt * 0.042
  })

  return (
    <group>
      <points ref={fineRef} geometry={fineGeo}>
        <pointsMaterial size={0.11} color="#b5aea4" transparent opacity={0.78} sizeAttenuation />
      </points>
      <points ref={chunkRef} geometry={chunkGeo}>
        <pointsMaterial size={0.21} color="#ded6ca" transparent opacity={0.88} sizeAttenuation />
      </points>
    </group>
  )
}

// 3. Wahana antariksa Voyager mengambang di sebelah judul "cabinet"
function VoyagerProbe({ active }) {
  const probeRef = useRef()
  // Posisi lokal ini sejajar tepat di samping kanan tulisan sedang "cabinet"
  const basePos = useMemo(() => new THREE.Vector3(-42.8, 2.2, -3.4), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (probeRef.current) {
      probeRef.current.position.set(
        basePos.x + Math.sin(t * 0.35) * 0.25,
        basePos.y + Math.sin(t * 0.7) * 0.16,
        basePos.z + Math.cos(t * 0.3) * 0.2
      )
      probeRef.current.rotation.set(
        0.38 + Math.sin(t * 0.4) * 0.05,
        -0.65 + Math.cos(t * 0.3) * 0.06,
        0.28 + t * 0.04
      )
    }
  })

  return (
    <group ref={probeRef} position={basePos.toArray()} scale={0.78}>
      {/* Antena parabola utama (High-Gain Dish) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.24, 0.26, 28, 1, true]} />
        <meshStandardMaterial
          color="#eceae4"
          metalness={0.45}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Tiang penerima sinyal di tengah parabola */}
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.48, 8]} />
        <meshStandardMaterial color="#c8c5be" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Badan utama dekagonal & foil emas */}
      <mesh position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.3, 10]} />
        <meshStandardMaterial color="#2c3038" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Piringan emas ikonik (Golden Record) di sisi badan */}
      <mesh position={[0.39, 0, -0.24]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 20]} />
        <meshStandardMaterial color="#f2be63" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Boom Magnetometer panjang ke kiri atas */}
      <mesh position={[-1.15, 0.55, -0.25]} rotation={[0, 0, 1.12]}>
        <cylinderGeometry args={[0.016, 0.024, 2.5, 6]} />
        <meshStandardMaterial color="#9ea3ad" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Boom RTG (sumber daya nuklir) ke kanan bawah */}
      <mesh position={[0.72, -0.52, -0.32]} rotation={[0, 0, -0.95]}>
        <cylinderGeometry args={[0.045, 0.055, 1.45, 10]} />
        <meshStandardMaterial color="#595d66" metalness={0.6} roughness={0.45} />
      </mesh>

      {/* Boom instrumen kamera / spektral ke bawah */}
      <mesh position={[0.1, -0.78, -0.2]} rotation={[0.15, 0, 0.1]}>
        <cylinderGeometry args={[0.02, 0.026, 1.35, 6]} />
        <meshStandardMaterial color="#b4b8c2" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0.16, -1.45, -0.1]}>
        <boxGeometry args={[0.22, 0.16, 0.18]} />
        <meshStandardMaterial color="#d4cfc4" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Pendar cahaya halus agar siluet wahana terbaca jelas di ruang gelap */}
      <Glow size={2.2} color="#ffd99e" opacity={0.32} />

      {active && (
        <Html position={[0, 1.35, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div className="planet-label accent" style={{ color: '#e7a663' }}>
            VOYAGER 1
            <span>INTERSTELLAR</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function PlanetNode({ data, active }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const moonRefs = useRef([])

  const texture = useMemo(
    () => createPlanetTexture(data.colors, data.banded),
    [data.colors, data.banded]
  )

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime * data.speed + data.phase
    if (groupRef.current) {
      groupRef.current.position.set(
        Math.cos(t) * data.distance,
        0,
        Math.sin(t) * data.distance
      )
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.35
    }
    if (data.moons) {
      data.moons.forEach((m, idx) => {
        const el = moonRefs.current[idx]
        if (!el) return
        const mt = clock.elapsedTime * m.speed + idx * 2.1
        el.position.set(Math.cos(mt) * m.distance, 0, Math.sin(mt) * m.distance)
      })
    }
  })

  return (
    <>
      <OrbitRing radius={data.distance} />

      <group ref={groupRef}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshStandardMaterial map={texture} roughness={0.68} metalness={0.05} />
        </mesh>

        {data.ring && (
          <mesh rotation={data.ring.tilt}>
            <ringGeometry args={[data.ring.inner, data.ring.outer, 64]} />
            <meshStandardMaterial
              color={data.ring.color}
              side={THREE.DoubleSide}
              transparent
              opacity={0.58}
              roughness={0.8}
            />
          </mesh>
        )}

        {data.moons?.map((m, idx) => (
          <mesh key={idx} ref={(el) => (moonRefs.current[idx] = el)}>
            <sphereGeometry args={[m.radius, 16, 16]} />
            <meshStandardMaterial color={m.color} roughness={0.8} />
          </mesh>
        ))}

        {active && (
          <Html position={[0, data.radius + 0.35, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`planet-label ${data.home ? 'home' : ''}`}>
              {data.name}
              {data.sub && <span>{data.sub}</span>}
            </div>
          </Html>
        )}
      </group>
    </>
  )
}

export default function SolarSystem({ active }) {
  return (
    <group>
      {/* Cahaya Matahari + cahaya pengisi lembut agar wahana Voyager di kejauhan tetap terang */}
      <ambientLight intensity={0.42} />
      <pointLight position={[0, 0, 0]} intensity={3.4} distance={130} decay={0.55} color="#fff2d6" />

      {/* Matahari di tepi kanan */}
      <mesh>
        <sphereGeometry args={[2.5, 40, 40]} />
        <meshBasicMaterial color="#ffe4a3" />
      </mesh>
      <Glow size={11} color="#ffbe6b" opacity={0.65} />
      <Glow size={5.8} color="#fff3cf" opacity={0.95} />

      {active && (
        <Html position={[0, 3.2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div className="planet-label">SUN</div>
        </Html>
      )}

      {/* Sabuk Asteroid padat di antara Mars & Jupiter */}
      <AsteroidBelt />

      {/* Wahana Voyager di dekat tulisan "cabinet" */}
      <VoyagerProbe active={active} />

      {/* Seluruh planet & bulan */}
      {PLANETS.map((planet) => (
        <PlanetNode key={planet.name} data={planet} active={active} />
      ))}
    </group>
  )
}