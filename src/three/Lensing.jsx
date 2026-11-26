import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import Galaxy from './Galaxy'
import Glow from './Glow'

const S_POS = new THREE.Vector3(18, 2.2, 0)   // Background Galaxy (sumber cahaya)
const E_POS = new THREE.Vector3(-18, 1.5, 0)  // Earth (pengamat)
const GRID_Y = -3.0                           // Ketinggian lantai ruang-waktu
const LENS_Y = 1.6                            // Ketinggian Foreground Galaxy
const MAX_SWEEP = 11.5                        // Jarak gerak menyamping lensa

function wellDepth(x, z, lx, lz) {
  const dx = x - lx
  const dz = z - lz
  const r2 = dx * dx + dz * dz
  return -5.2 / Math.sqrt(1.0 + r2 / 9.0)
}

// 1. Grid ruang-waktu yang melekuk dinamis mengikuti Foreground Galaxy
function DynamicWell({ lensZRef }) {
  const matRef = useRef()

  const { geo, mat } = useMemo(() => {
    const g = new THREE.PlaneGeometry(76, 64, 96, 84)
    g.rotateX(-Math.PI / 2)

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uLensXZ: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform vec2 uLensXZ;
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vDepth;

        void main() {
          vUv = uv;
          vec3 p = position;
          vec2 d = p.xz - uLensXZ;
          float r2 = dot(d, d);
          float depth = -5.2 / sqrt(1.0 + r2 / 9.0);
          p.y += depth;
          vPos = p;
          vDepth = depth;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vDepth;

        void main() {
          // Garis grid kotak (quad) bersih tanpa diagonal
          vec2 coord = vUv * vec2(38.0, 32.0);
          vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
          float line = 1.0 - min(min(grid.x, grid.y), 1.0);

          // Bayangan & pencahayaan halus pada dinding lekukan
          vec3 normal = normalize(cross(dFdx(vPos), dFdy(vPos)));
          vec3 lightDir = normalize(vec3(5.0, 9.0, 4.0));
          float diff = max(dot(normal, lightDir), 0.0);

          float wellFactor = clamp(-vDepth / 5.2, 0.0, 1.0);
          float shadowAlpha = (1.0 - diff) * 0.38 * wellFactor;

          vec3 baseSurface = vec3(0.012, 0.014, 0.02);
          // <-- DIUBAH: Garis grid lebih terang & jangkauan pudar lebih luas
          vec3 lineColor = mix(vec3(0.36, 0.39, 0.46), vec3(0.75, 0.78, 0.86), diff * 0.7 + wellFactor * 0.3);
          float lineAlpha = line * mix(0.34, 0.65, wellFactor);

          // Memudar halus ke gelap di tepi dan kejauhan
          float distFade = 1.0 - smoothstep(24.0, 46.0, length(vPos.xz));
          vec3 finalColor = mix(baseSurface, lineColor, line);
          float finalAlpha = max(shadowAlpha, lineAlpha) * distFade;

          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
    })

    return { geo: g, mat: m }
  }, [])

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uLensXZ.value.set(0, lensZRef.current)
    }
  })

  return <mesh position={[0, GRID_Y, 0]} geometry={geo} material={mat} ref={(m) => (matRef.current = m?.material)} />
}

// 2. Bola Bumi dengan tekstur prosedural benua & atmosfer
function EarthMesh() {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#183358'
    ctx.fillRect(0, 0, 256, 128)

    // Bentuk benua & awan halus
    const blobs = [
      [55, 42, 24, '#4e6b5c'], [72, 65, 18, '#6f7c68'], [130, 38, 28, '#55705e'],
      [148, 68, 20, '#78826e'], [205, 52, 22, '#506b5c'], [110, 92, 30, '#8d969e'],
    ]
    blobs.forEach(([x, y, r, color]) => {
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r)
      grad.addColorStop(0, color)
      grad.addColorStop(1, 'rgba(24,51,88,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = 'rgba(235, 242, 255, 0.22)'
    for (let i = 0; i < 18; i++) {
      ctx.fillRect((i * 37) % 240, (i * 19) % 115, 26, 4)
    }

    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <group position={E_POS}>
      <mesh rotation={[0.2, 0.8, -0.15]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial map={tex} roughness={0.65} metalness={0.1} />
      </mesh>
      <Glow size={3.2} color="#6fa0ff" opacity={0.45} />
    </group>
  )
}

// 3. Jendela 3D "WHAT EARTH SEES" dengan simulasi cincin Einstein real-time
function EarthViewScreen({ lensZRef, active }) {
  const matRef = useRef()
  const screenPos = useMemo(() => new THREE.Vector3(17.5, 6.2, -5.2), [])

  const { shaderMat, borderGeo, rayLinesGeo } = useMemo(() => {
    const w = 7.4
    const h = 4.6

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uLensOffset: { value: 0.0 },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uLensOffset;
        uniform float uTime;
        varying vec2 vUv;

        // Gambar galaksi spiral prosedural
        vec3 spiralGalaxy(vec2 p) {
          float r = length(p);
          if (r > 0.55) return vec3(0.0);
          float angle = atan(p.y, p.x);
          float twist = angle + r * 14.0 - uTime * 0.4;
          float arms = 0.5 + 0.5 * cos(2.0 * twist);
          arms = pow(arms, 2.2);
          float core = exp(-r * 16.0);
          float disk = exp(-r * 6.5) * (0.25 + 0.75 * arms);
          vec3 col = mix(vec3(0.45, 0.65, 1.0), vec3(1.0, 0.94, 0.85), core);
          return col * (core * 1.6 + disk * 0.95);
        }

        void main() {
          // Rasio aspek 7.4 : 4.6
          vec2 uv = (vUv - 0.5) * vec2(1.61, 1.0);

          // Posisi sumber (Background Galaxy) & lensa (Foreground Galaxy) di bidang pandang Bumi
          vec2 sourcePos = vec2(0.14, 0.0);
          vec2 lensPos = vec2(0.14 - uLensOffset, 0.0);

          // Persamaan Gravitational Lensing (Einstein Ring & busur ganda)
          vec2 rel = uv - lensPos;
          float r2 = dot(rel, rel) + 0.0004;
          float thetaE = 0.24;
          vec2 beta = uv - (thetaE * thetaE / r2) * rel;

          // Evaluasi galaksi latar yang terdistorsi gravitasi
          vec2 galCoord = (beta - sourcePos) * vec2(1.0, 1.35);
          vec3 lensedGal = spiralGalaxy(galCoord);

          // Cahaya Foreground Galaxy (oranye hangat)
          float dLens = length(rel);
          vec3 lensStar = vec3(1.0, 0.68, 0.34) * (exp(-dLens * 28.0) * 1.5 + exp(-dLens * 9.0) * 0.32);

          // Bintang latar kecil redup di dalam frame
          vec3 bg = vec3(0.015, 0.017, 0.024);
          vec3 color = bg + lensedGal + lensStar;

          gl_FragColor = vec4(color, 0.92);
        }
      `,
    })

    // Garis bingkai tipis persegi panjang
    const hw = w / 2
    const hh = h / 2
    const bPts = [
      new THREE.Vector3(-hw, -hh, 0.01),
      new THREE.Vector3(hw, -hh, 0.01),
      new THREE.Vector3(hw, hh, 0.01),
      new THREE.Vector3(-hw, hh, 0.01),
      new THREE.Vector3(-hw, -hh, 0.01),
    ]
    const bGeo = new THREE.BufferGeometry().setFromPoints(bPts)

    // Garis proyeksi dari Background Galaxy menuju sudut layar
    const rotY = -0.55 // <-- DIUBAH: Sudut layar menghadap kamera baru
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0))
    const c1 = new THREE.Vector3(-hw, -hh, 0).applyQuaternion(q).add(screenPos)
    const c2 = new THREE.Vector3(-hw, hh, 0).applyQuaternion(q).add(screenPos)
    const rGeo = new THREE.BufferGeometry().setFromPoints([S_POS, c1, S_POS, c2])

    return { shaderMat: mat, borderGeo: bGeo, rayLinesGeo: rGeo }
  }, [screenPos])

  useFrame(({ clock }) => {
    if (matRef.current) {
      // Skala simpangan lensa ke koordinat layar
      matRef.current.uniforms.uLensOffset.value = (lensZRef.current / MAX_SWEEP) * 0.72
      matRef.current.uniforms.uTime.value = clock.elapsedTime
    }
  })

  return (
    <group>
      {/* Garis penghubung proyeksi dari Background Galaxy */}
      <lineSegments geometry={rayLinesGeo}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.14} />
      </lineSegments>

      {/* <-- DIUBAH: rotation Y disamakan menjadi -0.55 */}
      <group position={screenPos} rotation={[0, -0.55, 0]}>
        <mesh material={shaderMat} ref={(m) => (matRef.current = m?.material)}>
          <planeGeometry args={[7.4, 4.6]} />
        </mesh>
        <line geometry={borderGeo}>
          <lineBasicMaterial color="#9fa3ad" transparent opacity={0.45} />
        </line>

        {active && (
          <Html position={[-3.7, 2.65, 0]} style={{ pointerEvents: 'none' }}>
            <div className="orbit-label" style={{ textAlign: 'left', color: '#8f9299' }}>
              WHAT EARTH SEES
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

// 4. Sinar cahaya melengkung & garis vertikal penunjuk posisi ke grid
function LensingRaysAndGuides({ lensGroupRef, lensZRef, active }) {
  const rayGeos = useMemo(() => {
    // 4 berkas sinar melengkung (atas, bawah, kiri, kanan)
    return [0, 1, 2, 3].map(() => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48 * 3), 3))
      return geo
    })
  }, [])

  const apparentGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 3), 3))
    return geo
  }, [])

  const guideGeo = useMemo(() => {
    // 3 garis vertikal: Earth, Background Galaxy, Foreground Galaxy
    const geo = new THREE.BufferGeometry()
    const arr = new Float32Array(6 * 3)
    // Earth drop line
    arr.set([E_POS.x, E_POS.y, E_POS.z, E_POS.x, GRID_Y, E_POS.z], 0)
    // Background Galaxy drop line
    arr.set([S_POS.x, S_POS.y, S_POS.z, S_POS.x, GRID_Y, S_POS.z], 6)
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return geo
  }, [])

  const wellLabelRef = useRef()
  const rayMatRefs = useRef([])

  useFrame(() => {
    const lz = lensZRef.current
    if (lensGroupRef.current) {
      lensGroupRef.current.position.set(0, LENS_Y, lz)
    }

    // Update garis vertikal Foreground Galaxy sampai dasar sumur gravitasi
    const bottomY = GRID_Y + wellDepth(0, lz, 0, lz)
    const gAttr = guideGeo.attributes.position
    gAttr.setXYZ(4, 0, LENS_Y, lz)
    gAttr.setXYZ(5, 0, bottomY, lz)
    gAttr.needsUpdate = true

    if (wellLabelRef.current) {
      wellLabelRef.current.position.set(0, bottomY - 0.6, lz)
    }

    // Hitung kelengkungan sinar berdasarkan kedekatan lensa
    const alignment = Math.exp(-(lz * lz) / 18.0) // 1 saat sejajar, ~0 saat jauh
    const bendR = 1.6 + 1.4 * alignment

    const offsets = [
      [0, bendR, lz * 0.55],                          // busur atas
      [0, -bendR * (0.4 + 0.6 * alignment), lz * 0.55], // busur bawah
      [0, 0.25, lz + bendR * 0.85],                   // sisi luar
      [0, -0.25, lz - bendR * (0.35 + 0.65 * alignment)], // sisi dalam
    ]

    offsets.forEach((ctrl, idx) => {
      const geo = rayGeos[idx]
      const attr = geo.attributes.position
      const p0 = S_POS
      const p1 = new THREE.Vector3(ctrl[0], LENS_Y + ctrl[1], ctrl[2])
      const p2 = E_POS

      for (let i = 0; i < 48; i++) {
        const t = i / 47
        const mt = 1 - t
        // Kurva Bezier kuadratik halus
        const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x
        const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        const z = mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z
        attr.setXYZ(i, x, y, z)
      }
      attr.needsUpdate = true

      // Sinar sekunder memudar saat lensa menjauh dari garis pandang
      if (rayMatRefs.current[idx]) {
        const baseOp = idx === 0 ? 0.65 : 0.12 + 0.45 * alignment
        rayMatRefs.current[idx].opacity = baseOp
      }
    })

    // Garis proyeksi bayangan semu dari Bumi melewati lensa
    const aAttr = apparentGeo.attributes.position
    const topTarget = new THREE.Vector3(18, LENS_Y + bendR * 1.9, lz * 1.1)
    const botTarget = new THREE.Vector3(18, LENS_Y - bendR * 1.9, lz * 1.1)
    aAttr.setXYZ(0, E_POS.x, E_POS.y, E_POS.z)
    aAttr.setXYZ(1, topTarget.x, topTarget.y, topTarget.z)
    aAttr.setXYZ(2, E_POS.x, E_POS.y, E_POS.z)
    aAttr.setXYZ(3, botTarget.x, botTarget.y, botTarget.z)
    aAttr.needsUpdate = true
  })

  return (
    <group>
      {/* Sinar cahaya utama & yang terbelokkan */}
      {rayGeos.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial
            ref={(el) => (rayMatRefs.current[i] = el)}
            color={i === 0 ? '#ffd7a8' : '#b89f8d'}
            transparent
            opacity={0.5}
          />
        </line>
      ))}

      {/* Garis arah bayangan semu */}
      <lineSegments geometry={apparentGeo}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.14} />
      </lineSegments>

      {/* Garis vertikal dari objek ke grid */}
      <lineSegments geometry={guideGeo}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </lineSegments>

      {/* Label dasar sumur gravitasi yang ikut bergerak */}
      <group ref={wellLabelRef}>
        {active && (
          <Html center style={{ pointerEvents: 'none' }}>
            <div className="orbit-label">foreground galaxy</div>
          </Html>
        )}
      </group>
    </group>
  )
}

// 5. Grafik kurva cahaya (Brightness vs Time) di pojok kanan bawah
function BrightnessCurveHUD({ lensZRef }) {
  const dotRef = useRef()

  // Bentuk kurva Paczynski (puncak di tengah t = 0.5)
  const curvePath = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 60; i++) {
      const s = i / 60 // 0..1
      const u = Math.hypot((s - 0.5) * 4.2, 0.28)
      const amp = (u * u + 2) / (u * Math.sqrt(u * u + 4)) - 1.0
      const x = 14 + s * 116
      const y = 62 - Math.min(amp * 18, 50)
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [])

  useFrame(() => {
    if (!dotRef.current) return
    const norm = (lensZRef.current / MAX_SWEEP) * 0.5 + 0.5 // 0..1
    const u = Math.hypot((norm - 0.5) * 4.2, 0.28)
    const amp = (u * u + 2) / (u * Math.sqrt(u * u + 4)) - 1.0
    const cx = 14 + norm * 116
    const cy = 62 - Math.min(amp * 18, 50)
    dotRef.current.setAttribute('cx', cx.toFixed(1))
    dotRef.current.setAttribute('cy', cy.toFixed(1))
  })

  return (
    // <-- DIUBAH: Menambahkan calculatePosition agar menempel rapi di pojok layar
    <Html fullscreen calculatePosition={() => [0, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'fixed',
          left: '28px',
          bottom: '24px',
          color: '#74787c',
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Gravitational Lensing
      </div>

      <div
        style={{
          position: 'fixed',
          right: '28px',
          bottom: '20px',
          width: '144px',
          height: '82px',
        }}
      >
        <svg width="144" height="82" viewBox="0 0 144 82" style={{ overflow: 'visible' }}>
          {/* Sumbu vertikal & horizontal */}
          <line x1="14" y1="8" x2="14" y2="64" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
          <line x1="14" y1="64" x2="134" y2="64" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

          {/* Kurva magnifikasi */}
          <path d={curvePath} fill="none" stroke="rgba(231, 166, 99, 0.65)" strokeWidth="1.3" />

          {/* Titik indikator posisi saat ini */}
          <circle ref={dotRef} cx="72" cy="14" r="3" fill="#ffcf9e" />

          <text
            x="6"
            y="36"
            fill="#74787c"
            fontSize="7"
            fontWeight="600"
            letterSpacing="1.6"
            transform="rotate(-90 6 36)"
            textAnchor="middle"
          >
            BRIGHTNESS
          </text>
          <text
            x="74"
            y="76"
            fill="#74787c"
            fontSize="7"
            fontWeight="600"
            letterSpacing="1.6"
            textAnchor="middle"
          >
            TIME
          </text>
        </svg>
      </div>
    </Html>
  )
}

export default function Lensing({ active }) {
  const lensZRef = useRef(0)
  const lensGroupRef = useRef()

  useFrame(({ clock }) => {
    // Gerak melintas halus bolak-balik melewati garis pandang Bumi - Galaksi Latar
    lensZRef.current = Math.sin(clock.elapsedTime * 0.28) * MAX_SWEEP
  })

  return (
    <group>
      {/* <-- DIUBAH: Cahaya lebih terang agar tekstur Bumi & warna terlihat jelas */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[12, 18, 16]} intensity={2.1} color="#fff8ee" />

      <DynamicWell lensZRef={lensZRef} />

      {/* Foreground Galaxy (bergerak melintas menciptakan efek lensing) */}
      <group ref={lensGroupRef} position={[0, LENS_Y, 0]}>
        <Glow size={4.2} color="#ffb974" opacity={0.95} />
        <Glow size={1.6} color="#fff4e0" opacity={1} />
      </group>

      {/* Background Galaxy (sumber cahaya spiral) */}
      <Galaxy
        position={S_POS.toArray()}
        rotation={[0.9, 0.35, 0.2]}
        radius={1.8}
        count={2600}
        branches={2}
        size={0.07}
        speed={0.06}
        inside="#ffffff"
        outside="#7da2ff"
      />
      <Glow position={S_POS.toArray()} size={4.2} color="#9bb8ff" opacity={0.55} />

      {/* Bumi */}
      <EarthMesh />

      {/* Sinar melengkung & garis bantu vertikal */}
      <LensingRaysAndGuides lensGroupRef={lensGroupRef} lensZRef={lensZRef} active={active} />

      {/* Layar proyeksi "WHAT EARTH SEES" */}
      <EarthViewScreen lensZRef={lensZRef} active={active} />

      {/* Label tetap & HUD grafik kecerahan */}
      {active && (
        <>
          <Html position={[S_POS.x, GRID_Y - 0.6, S_POS.z]} center style={{ pointerEvents: 'none' }}>
            <div className="orbit-label">background galaxy</div>
          </Html>
          <Html position={[E_POS.x, GRID_Y - 0.6, E_POS.z]} center style={{ pointerEvents: 'none' }}>
            <div className="orbit-label">earth</div>
          </Html>
          <BrightnessCurveHUD lensZRef={lensZRef} />
        </>
      )}
    </group>
  )
}