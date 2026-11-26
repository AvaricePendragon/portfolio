import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import Glow from './Glow'

const HOLE_X = 0.4
const HOLE_Z = 0.0
const SHEET_H = 3.0

// 1. Lembaran grid ruang-waktu terlipat di sisi kanan (atas, lengkungan kanan, bawah)
function FoldedSpacetimeGrid() {
  const { geo, mat } = useMemo(() => {
    const segU = 190
    const segV = 96
    const halfW = 10.0
    const leftX = -8.5
    const bendX = 6.2

    const flatLen = bendX - leftX
    const bendLen = Math.PI * SHEET_H
    const totalLen = flatLen * 2 + bendLen

    const positions = []
    const uvs = []
    const sheetSigns = []
    const indices = []

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU
      const s = u * totalLen

      let baseX = 0
      let baseY = 0
      let sign = 0

      if (s < flatLen) {
        // Lembaran atas (kiri ke kanan)
        baseX = leftX + s
        baseY = SHEET_H
        sign = 1
      } else if (s < flatLen + bendLen) {
        // Lengkungan lipatan U di sisi kanan (+X)
        const a = Math.PI * 0.5 - ((s - flatLen) / bendLen) * Math.PI
        baseX = bendX + Math.cos(a) * SHEET_H
        baseY = Math.sin(a) * SHEET_H
        sign = 0
      } else {
        // Lembaran bawah (kanan ke kiri)
        const s2 = s - (flatLen + bendLen)
        baseX = bendX - s2
        baseY = -SHEET_H
        sign = -1
      }

      for (let iv = 0; iv <= segV; iv++) {
        const v = iv / segV
        const z = (v - 0.5) * 2 * halfW
        let y = baseY

        if (sign !== 0 && baseX < bendX - 0.5) {
          const dx = baseX - HOLE_X
          const dz = z - HOLE_Z
          const r = Math.hypot(dx, dz)
          const dr = Math.max(0, r - 0.85)
          const funnel = Math.exp(-(dr * dr) / 8.2)
          y = baseY * (1.0 - 0.86 * funnel)
        }

        positions.push(baseX, y, z)
        uvs.push(u * 22.0, v * 11.0)
        sheetSigns.push(sign)
      }
    }

    for (let iu = 0; iu < segU; iu++) {
      for (let iv = 0; iv < segV; iv++) {
        const a = iu * (segV + 1) + iv
        const b = a + 1
        const c = (iu + 1) * (segV + 1) + iv
        const d = c + 1
        indices.push(a, b, d, a, d, c)
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setAttribute('aSign', new THREE.Float32BufferAttribute(sheetSigns, 1))
    g.setIndex(indices)
    g.computeVertexNormals()

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uHoleXZ: { value: new THREE.Vector2(HOLE_X, HOLE_Z) },
      },
      vertexShader: `
        attribute float aSign;
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vSign;

        void main() {
          vUv = uv;
          vPos = position;
          vSign = aSign;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uHoleXZ;
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vSign;

        void main() {
          float rHole = length(vPos.xz - uHoleXZ);
          if (abs(vSign) > 0.5 && rHole < 0.88) discard;

          vec2 grid = abs(fract(vUv - 0.5) - 0.5) / fwidth(vUv);
          float line = 1.0 - min(min(grid.x, grid.y), 1.0);

          float glow = exp(-max(0.0, rHole - 0.85) * 0.34);
          vec3 baseLine = vec3(0.45, 0.48, 0.56);
          vec3 yellowTint = vec3(1.0, 0.80, 0.34);
          vec3 blueTint = vec3(0.36, 0.72, 1.0);

          vec3 tint = vSign > 0.0 ? yellowTint : (vSign < 0.0 ? blueTint : baseLine);
          vec3 lineColor = mix(baseLine, tint, glow * 0.9);

          // Lipatan di sisi kanan tetap tegas terlihat, sisi kiri memudar halus
          float edgeX = smoothstep(-8.4, -4.0, vPos.x);
          float edgeZ = 1.0 - smoothstep(6.5, 10.0, abs(vPos.z));
          float alpha = line * mix(0.32, 0.74, glow) * edgeX * edgeZ;

          gl_FragColor = vec4(lineColor, alpha);
        }
      `,
    })

    return { geo: g, mat: m }
  }, [])

  return <mesh geometry={geo} material={mat} />
}

// 2. Terowongan penghubung (Throat) kuning atas -> putih -> biru bawah
function WormholeThroat() {
  const matRef = useRef()

  const { geo, mat } = useMemo(() => {
    const radialSegs = 64
    const heightSegs = 48
    const halfH = 1.3

    const positions = []
    const uvs = []
    const indices = []

    for (let iy = 0; iy <= heightSegs; iy++) {
      const v = iy / heightSegs
      const y = (v - 0.5) * 2 * halfH
      const r = 0.56 + 0.32 * y * y

      for (let ix = 0; ix <= radialSegs; ix++) {
        const u = ix / radialSegs
        const theta = u * Math.PI * 2
        positions.push(
          HOLE_X + Math.cos(theta) * r,
          y,
          HOLE_Z + Math.sin(theta) * r
        )
        uvs.push(u * 24.0, v * 10.0)
      }
    }

    for (let iy = 0; iy < heightSegs; iy++) {
      for (let ix = 0; ix < radialSegs; ix++) {
        const a = iy * (radialSegs + 1) + ix
        const b = a + 1
        const c = (iy + 1) * (radialSegs + 1) + ix
        const d = c + 1
        indices.push(a, c, d, a, d, b)
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    g.setIndex(indices)

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vY;
        void main() {
          vUv = uv;
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vY;

        void main() {
          vec2 animUv = vec2(vUv.x + uTime * 0.25, vUv.y + uTime * 0.55);
          vec2 grid = abs(fract(animUv - 0.5) - 0.5) / fwidth(animUv);
          float line = 1.0 - min(min(grid.x, grid.y), 1.0);

          vec3 yellow = vec3(1.0, 0.82, 0.36);
          vec3 white = vec3(0.95, 0.97, 1.0);
          vec3 blue = vec3(0.32, 0.70, 1.0);

          float t = clamp(vY / 1.05, -1.0, 1.0);
          vec3 col = t >= 0.0
            ? mix(white, yellow, smoothstep(0.0, 1.0, t))
            : mix(white, blue, smoothstep(0.0, 1.0, -t));

          float endFade = 1.0 - smoothstep(0.92, 1.3, abs(vY));
          float alpha = (0.18 + line * 0.48) * endFade;

          gl_FragColor = vec4(col, alpha);
        }
      `,
    })

    return { geo: g, mat: m }
  }, [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return <mesh geometry={geo} material={mat} ref={(m) => (matRef.current = m?.material)} />
}

// 3. Aliran cahaya kuning masuk dari atas & biru keluar dari bawah
function LightStreams() {
  const pulseRef = useRef()
  const inPtsRef = useRef()
  const outPtsRef = useRef()

  const { curve, ribbonGeo } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(6.4, SHEET_H + 0.14, 2.2),
      new THREE.Vector3(3.2, SHEET_H + 0.12, 1.2),
      new THREE.Vector3(HOLE_X + 0.45, 1.4, 0.35),
      new THREE.Vector3(HOLE_X, 0.0, 0.0),
      new THREE.Vector3(HOLE_X - 0.45, -1.4, -0.35),
      new THREE.Vector3(3.2, -SHEET_H - 0.12, -1.2),
      new THREE.Vector3(6.4, -SHEET_H - 0.14, -2.2),
    ])

    const segs = 180
    const pts = c.getPoints(segs)
    const colors = new Float32Array((segs + 1) * 3)
    const cYellow = new THREE.Color('#ffd369')
    const cWhite = new THREE.Color('#ffffff')
    const cBlue = new THREE.Color('#4db8ff')
    const tmp = new THREE.Color()

    pts.forEach((p, i) => {
      if (p.y > 0.15) {
        const k = Math.min(1, (p.y - 0.15) / 1.5)
        tmp.copy(cWhite).lerp(cYellow, k)
      } else if (p.y < -0.15) {
        const k = Math.min(1, (-p.y - 0.15) / 1.5)
        tmp.copy(cWhite).lerp(cBlue, k)
      } else {
        tmp.copy(cWhite)
      }
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    })

    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { curve: c, ribbonGeo: geo }
  }, [])

  const { inGeo, inSeeds, outGeo, outSeeds } = useMemo(() => {
    const count = 160
    const makeStream = () => {
      const pos = new Float32Array(count * 3)
      const seeds = Array.from({ length: count }, (_, i) => ({
        phase: i / count,
        angle: Math.random() * Math.PI * 2,
        spread: 0.25 + Math.random() * 1.45,
        speed: 0.16 + Math.random() * 0.12,
      }))
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      return { g, seeds }
    }

    const masuk = makeStream()
    const keluar = makeStream()
    return { inGeo: masuk.g, inSeeds: masuk.seeds, outGeo: keluar.g, outSeeds: keluar.seeds }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (pulseRef.current) {
      const u = (t * 0.14) % 1
      const pos = curve.getPointAt(u)
      pulseRef.current.position.copy(pos)
    }

    if (inPtsRef.current) {
      const attr = inPtsRef.current.geometry.attributes.position
      inSeeds.forEach((s, i) => {
        const p = (s.phase + t * s.speed) % 1
        const y = (1 - p) * 5.0 + 0.1
        const r = Math.pow(1 - p, 1.4) * s.spread + 0.18
        const a = s.angle + p * 3.8
        attr.setXYZ(i, HOLE_X + Math.cos(a) * r, y, HOLE_Z + Math.sin(a) * r)
      })
      attr.needsUpdate = true
    }

    if (outPtsRef.current) {
      const attr = outPtsRef.current.geometry.attributes.position
      outSeeds.forEach((s, i) => {
        const p = (s.phase + t * s.speed) % 1
        const y = -p * 5.0 - 0.1
        const r = Math.pow(p, 1.35) * s.spread + 0.18
        const a = s.angle - p * 3.8
        attr.setXYZ(i, HOLE_X + Math.cos(a) * r, y, HOLE_Z + Math.sin(a) * r)
      })
      attr.needsUpdate = true
    }
  })

  return (
    <group>
      <line geometry={ribbonGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.62} />
      </line>

      <group ref={pulseRef}>
        <Glow size={1.6} color="#ffffff" opacity={0.95} />
      </group>

      <points ref={inPtsRef} geometry={inGeo}>
        <pointsMaterial size={0.13} color="#ffd466" transparent opacity={0.85} sizeAttenuation />
      </points>

      <points ref={outPtsRef} geometry={outGeo}>
        <pointsMaterial size={0.13} color="#4fc3ff" transparent opacity={0.85} sizeAttenuation />
      </points>
    </group>
  )
}

// 4. Pesawat Endurance agak menyamping di atas mulut masuk wormhole
const ENDURANCE_POS = [HOLE_X + 2.35, 3.65, HOLE_Z + 0.85]

function EnduranceShip() {
  const floatRef = useRef()
  const spinRef = useRef()
  const basePos = useMemo(() => new THREE.Vector3(...ENDURANCE_POS), [])

  const modules = useMemo(() => {
    const count = 12
    const radius = 0.96
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angle,
        isLab: i % 2 === 0,
      }
    })
  }, [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (floatRef.current) {
      floatRef.current.position.set(
        basePos.x + Math.sin(t * 0.4) * 0.14,
        basePos.y + Math.sin(t * 0.75) * 0.12,
        basePos.z + Math.cos(t * 0.35) * 0.12
      )
    }
    if (spinRef.current) {
      spinRef.current.rotation.z += dt * 0.22
    }
  })

  return (
    <group ref={floatRef} position={basePos.toArray()} scale={0.85}>
      <group ref={spinRef} rotation={[-0.92, -0.38, -0.22]}>
        <mesh>
          <torusGeometry args={[0.96, 0.028, 12, 48]} />
          <meshStandardMaterial color="#8f959e" metalness={0.75} roughness={0.3} />
        </mesh>

        {modules.map((m, idx) => (
          <group key={idx} position={[m.x, m.y, 0]} rotation={[0, 0, m.angle]}>
            <mesh>
              <boxGeometry args={[0.25, 0.36, 0.22]} />
              <meshStandardMaterial
                color={m.isLab ? '#e8e5dc' : '#2d323b'}
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0.04, 0, 0.115]}>
              <boxGeometry args={[0.14, 0.26, 0.02]} />
              <meshStandardMaterial
                color={m.isLab ? '#363b45' : '#cfc9bc'}
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}

        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.032, 0.038, 0.92, 12]} />
          <meshStandardMaterial color="#d4d0c7" metalness={0.65} roughness={0.32} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.26, 16]} />
          <meshStandardMaterial color="#e6e3da" metalness={0.55} roughness={0.35} />
        </mesh>

        <group position={[0, 0, 0.22]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.34, 4]} />
            <meshStandardMaterial color="#f2efe9" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>

        <group position={[0, -1.16, 0]} rotation={[0, 0, Math.PI]}>
          <mesh>
            <coneGeometry args={[0.13, 0.3, 4]} />
            <meshStandardMaterial color="#f2efe9" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      </group>

      <Glow size={2.2} color="#ffe3a3" opacity={0.28} />
    </group>
  )
}

// 5. Tiga planet Interstellar tersebar acak dengan ukuran berbeda di sekeliling pintu keluar bawah
const INTERSTELLAR_PLANETS = [
  {
    name: "MILLER'S PLANET",
    sub: '1 HR = 7 YRS',
    pos: [HOLE_X - 2.9, -5.8, 2.4],
    radius: 0.56,
    colors: ['#1a4175', '#2c68a8', '#78b4e6'],
    atmo: '#5eb8ff',
    speed: 0.38,
    driftPhase: 0.4,
  },
  {
    name: "MANN'S PLANET",
    sub: 'ICE CLOUDS',
    pos: [HOLE_X + 3.4, -4.9, -2.0],
    radius: 0.36,
    colors: ['#cad5e3', '#8c9fb8', '#eef4fc'],
    atmo: '#b8d4f2',
    speed: 0.24,
    driftPhase: 2.1,
  },
  {
    name: "EDMUNDS' PLANET",
    sub: 'HABITABLE',
    pos: [HOLE_X + 1.8, -6.5, 2.6],
    radius: 0.24,
    colors: ['#c47743', '#8a4c25', '#e8aa74'],
    atmo: '#f5b97f',
    speed: 0.31,
    driftPhase: 4.3,
  },
]

function createExoplanetTexture(colors) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, 256, 128)

  const patches = [
    [48, 38, 28, colors[1]],
    [118, 62, 34, colors[1]],
    [192, 44, 26, colors[2]],
    [84, 92, 24, colors[2]],
    [218, 86, 22, colors[1]],
    [150, 28, 20, colors[2]],
  ]

  patches.forEach(([x, y, r, c]) => {
    const grad = ctx.createRadialGradient(x, y, 2, x, y, r)
    grad.addColorStop(0, c)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function InterstellarPlanetItem({ planet, active, isMobile }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const tex = useMemo(() => createExoplanetTexture(planet.colors), [planet.colors])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + planet.driftPhase
    if (groupRef.current) {
      groupRef.current.position.set(
        planet.pos[0] + Math.sin(t * 0.28) * 0.16,
        planet.pos[1] + Math.cos(t * 0.35) * 0.14,
        planet.pos[2] + Math.sin(t * 0.22) * 0.14
      )
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * planet.speed
    }
  })

  return (
    <group ref={groupRef} position={planet.pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial map={tex} roughness={0.58} metalness={0.08} />
      </mesh>

      <Glow size={planet.radius * 3.6} color={planet.atmo} opacity={0.34} />

      {active && (
        <Html
          position={[0, -planet.radius - 0.26, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="planet-label"
            style={{
              fontSize: isMobile ? '7.5px' : '8.5px',
              lineHeight: 1.35,
              color: '#dfe3ec',
              whiteSpace: 'nowrap',
            }}
          >
            {planet.name}
            <span style={{ display: 'block', color: planet.atmo, fontSize: isMobile ? '6.5px' : '7px' }}>
              {planet.sub}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

function InterstellarSystem({ active, isMobile }) {
  return (
    <group>
      {INTERSTELLAR_PLANETS.map((planet) => (
        <InterstellarPlanetItem
          key={planet.name}
          planet={planet}
          active={active}
          isMobile={isMobile}
        />
      ))}
    </group>
  )
}

// 6. Penunjuk & label bagian-bagian Wormhole
function WormholeAnnotations({ isMobile }) {
  const items = [
    {
      title: 'ENDURANCE',
      sub: 'INTERSTELLAR RING',
      accent: '#ffe099',
      alignLeft: false,
      from: [ENDURANCE_POS[0] + 0.55, ENDURANCE_POS[1] + 0.35, ENDURANCE_POS[2]],
      elbow: [ENDURANCE_POS[0] + 1.35, ENDURANCE_POS[1] + 0.85, ENDURANCE_POS[2]],
      to: [ENDURANCE_POS[0] + 1.85, ENDURANCE_POS[1] + 0.85, ENDURANCE_POS[2]],
    },
    {
      title: 'UPPER MOUTH',
      sub: 'INFLOW FUNNEL',
      accent: '#ffd466',
      alignLeft: true,
      from: [HOLE_X - 1.35, 2.35, 0.5],
      elbow: [HOLE_X - 2.35, 2.75, 0.5],
      to: [HOLE_X - 2.9, 2.75, 0.5],
    },
    {
      title: 'EVENT HORIZON',
      sub: 'BOUNDARY RIM',
      accent: '#f0ede6',
      alignLeft: true,
      from: [HOLE_X - 0.82, 1.15, 0.25],
      elbow: [HOLE_X - 2.15, 1.4, 0.25],
      to: [HOLE_X - 2.7, 1.4, 0.25],
    },
    {
      title: 'THROAT (r = b₀)',
      sub: 'EINSTEIN–ROSEN BRIDGE',
      accent: '#d8dde6',
      alignLeft: true,
      from: [HOLE_X - 0.56, 0.0, 0.0],
      elbow: [HOLE_X - 2.05, 0.0, 0.0],
      to: [HOLE_X - 2.6, 0.0, 0.0],
    },
    {
      title: 'LOWER MOUTH',
      sub: 'OUTFLOW FUNNEL',
      accent: '#4fc3ff',
      alignLeft: true,
      from: [HOLE_X - 1.35, -2.35, -0.35],
      elbow: [HOLE_X - 2.35, -2.65, -0.35],
      to: [HOLE_X - 2.9, -2.65, -0.35],
    },
    {
      title: 'SPACETIME FOLDS',
      sub: 'CURVED MANIFOLD',
      accent: '#9ba2ae',
      alignLeft: false,
      from: [8.85, -1.25, 1.4],
      elbow: [9.45, -1.85, 1.4],
      to: [9.95, -1.85, 1.4],
    },
  ]

  const visibleItems = isMobile
    ? items.filter((it) =>
        ['ENDURANCE', 'EVENT HORIZON', 'THROAT (r = b₀)', 'SPACETIME FOLDS'].includes(it.title)
      )
    : items

  return (
    <group>
      {visibleItems.map((item) => (
        <group key={item.title}>
          <mesh position={item.from}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshBasicMaterial color={item.accent} />
          </mesh>

          <Line
            points={[item.from, item.elbow, item.to]}
            color="#ffffff"
            lineWidth={0.9}
            transparent
            opacity={0.42}
          />

          <Html
            position={[item.to[0] + (item.alignLeft ? -0.14 : 0.14), item.to[1], item.to[2]]}
            center={false}
            style={{
              pointerEvents: 'none',
              transform: item.alignLeft ? 'translate(-100%, -50%)' : 'translateY(-50%)',
            }}
          >
            <div
              className="planet-label"
              style={{
                textAlign: item.alignLeft ? 'right' : 'left',
                color: item.accent,
                fontSize: isMobile ? '8px' : '9px',
                lineHeight: 1.35,
              }}
            >
              {item.title}
              {item.sub && (
                <span style={{ display: 'block', color: '#7e838c', fontSize: isMobile ? '7px' : '7.5px' }}>
                  {item.sub}
                </span>
              )}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}

// 7. Rumus Metrik Traversable Wormhole (Morris–Thorne) di pojok kanan bawah
// 7. Rumus Metrik Traversable Wormhole (Morris–Thorne) di area kanan (sesuai kotak biru)
function WormholeFormulaHUD({ isMobile }) {
  const params = [
    { sym: 'Φ(r)',   desc: 'redshift function', color: '#ffd466' },
    { sym: 'b(r)',   desc: 'shape function',    color: '#4fc3ff' },
    { sym: 'r = b₀', desc: 'throat radius',     color: '#a5a7ad' },
  ]

  const boxStyle = isMobile
    ? {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 'calc(100dvh - 165px)',
        color: '#e6e4de',
        fontFamily: 'var(--serif)',
        whiteSpace: 'nowrap',
      }
    : {
        position: 'fixed',
        right: '16%', // Posisi horizontal di area kotak biru sebelah kanan
        top: '34%',   // Posisi vertikal di tengah-atas area kotak biru
        color: '#e6e4de',
        fontFamily: 'var(--serif)',
        whiteSpace: 'nowrap',
      }

  return (
    <Html fullscreen calculatePosition={() => [0, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100dvh', pointerEvents: 'none' }}>
        <div style={boxStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: isMobile ? '13.5px' : '15.5px' }}>
              <span>
                <i style={{ fontStyle: 'italic' }}>ds</i>
                <sup style={{ fontSize: '10px' }}>2</sup> = −<i style={{ fontStyle: 'italic' }}>e</i>
                <sup style={{ fontSize: '10px' }}>2Φ(<i style={{ fontStyle: 'italic' }}>r</i>)</sup>
                <i style={{ fontStyle: 'italic' }}>c</i>
                <sup style={{ fontSize: '10px' }}>2</sup>
                <i style={{ fontStyle: 'italic' }}>dt</i>
                <sup style={{ fontSize: '10px' }}>2</sup> +
              </span>

              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ padding: '0 6px 2px', borderBottom: '1px solid rgba(235,229,216,0.45)' }}>
                  <i style={{ fontStyle: 'italic' }}>dr</i>
                  <sup style={{ fontSize: '10px' }}>2</sup>
                </span>
                <span style={{ paddingTop: '2px', fontSize: isMobile ? '12.5px' : '13.5px' }}>
                  1 − <i style={{ fontStyle: 'italic' }}>b</i>(<i style={{ fontStyle: 'italic' }}>r</i>)/<i style={{ fontStyle: 'italic' }}>r</i>
                </span>
              </div>

              <span>
                + <i style={{ fontStyle: 'italic' }}>r</i>
                <sup style={{ fontSize: '10px' }}>2</sup>
                <i style={{ fontStyle: 'italic' }}>d</i>Ω
                <sup style={{ fontSize: '10px' }}>2</sup>
              </span>
            </div>

            <div
              style={{
                marginTop: isMobile ? '10px' : '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3.5px',
                fontFamily: 'var(--serif)',
                fontSize: isMobile ? '10.5px' : '11px',
              }}
            >
              {params.map((item) => (
                <div key={item.desc} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ color: item.color, width: '48px', textAlign: 'right', fontStyle: 'italic' }}>
                    {item.sym}
                  </span>
                  <span style={{ color: '#8f9298' }}>{item.desc}</span>
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
          Traversable Wormhole — Morris–Thorne Metric
        </div>
      </div>
    </Html>
  )
}

export default function Wormhole({ active }) {
  const width = useThree((s) => s.size.width)
  const isMobile = width < 768

  return (
    <group position={[0, 0, 0]} rotation={[0.08, 0.24, 0]}>
      <ambientLight intensity={0.85} />
      <pointLight position={[0.4, 2.2, 2.5]} intensity={2.4} distance={24} color="#ffe3a6" />
      <pointLight position={[0.4, -2.2, 2.5]} intensity={2.0} distance={24} color="#6bc4ff" />

      <FoldedSpacetimeGrid />
      <WormholeThroat />
      <LightStreams />
      <EnduranceShip />
      
      {/* Sistem exoplanet di bawah pintu keluar wormhole */}
      <InterstellarSystem active={active} isMobile={isMobile} />

      <Glow position={[0.4, 1.15, 0]} size={5.2} color="#ffd166" opacity={0.38} />
      <Glow position={[0.4, -1.15, 0]} size={5.2} color="#4db8ff" opacity={0.38} />

      {active && (
        <>
          <WormholeAnnotations isMobile={isMobile} />
          <WormholeFormulaHUD isMobile={isMobile} />
        </>
      )}
    </group>
  )
}