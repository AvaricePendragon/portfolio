import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Glow from './Glow'

export default function Tesseract() {
  const diskRef = useRef()
  const jetRef = useRef()

  // Tekstur halus untuk jet plasma biru
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    grad.addColorStop(0.3, 'rgba(180, 230, 255, 0.8)')
    grad.addColorStop(0.7, 'rgba(80, 170, 255, 0.25)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  // 1. Cakram Akresi Utama (Ketebalan meruncing tajam hingga setipis jarum di ujung)
  const diskStreaks = useMemo(() => {
    const streakCount = 3800
    const segmentsPerStreak = 12
    const totalVertices = streakCount * segmentsPerStreak * 2

    const positions = new Float32Array(totalVertices * 3)
    const colors = new Float32Array(totalVertices * 3)
    let ptr = 0

    for (let i = 0; i < streakCount; i++) {
      const u = Math.random() // 0 = dekat lubang hitam, 1 = tepi luar
      const radius = 1.15 + Math.pow(u, 1.35) * 6.8
      const startAngle = Math.random() * Math.PI * 2
      
      const closeness = Math.max(0, 1.0 - (radius - 1.15) / 6.8)
      const arcLength = (0.55 + closeness * 0.95) * (0.8 + Math.random() * 0.6)
      
      // Faktor penipisan tajam di ujung luar menggunakan pangkat tinggi (power curve)
      const sharpEdgeFactor = Math.pow(Math.sin(u * Math.PI), 2.2)
      const waveOffset = Math.random() * Math.PI * 2
      const baseThickness = (Math.random() - 0.5) * (0.015 + (radius - 1.15) * 0.08) * sharpEdgeFactor

      const coreGlow = Math.pow(closeness, 1.5)
      const rCol = 1.0
      const gCol = 0.35 + coreGlow * 0.65
      const bCol = coreGlow * 0.5

      for (let s = 0; s < segmentsPerStreak; s++) {
        const t1 = s / segmentsPerStreak
        const t2 = (s + 1) / segmentsPerStreak

        const a1 = startAngle + t1 * arcLength
        const a2 = startAngle + t2 * arcLength

        const rad1 = radius - t1 * 0.12
        const rad2 = radius - t2 * 0.12

        const taper1 = Math.sin(t1 * Math.PI)
        const taper2 = Math.sin(t2 * Math.PI)

        // Ketebalan vertikal meruncing tajam mendekati nol di ujung segmen
        const y1 = baseThickness + Math.sin(a1 * 2.0 + waveOffset) * (0.025 * sharpEdgeFactor * Math.pow(taper1, 1.5))
        const y2 = baseThickness + Math.sin(a2 * 2.0 + waveOffset) * (0.025 * sharpEdgeFactor * Math.pow(taper2, 1.5))

        // Pola jeda putus-putus dengan transisi tajam di ujung
        const dashFrequency = THREE.MathUtils.lerp(2.0, 11.0, u)
        const rawDash = Math.sin(t1 * Math.PI * dashFrequency) > 0.0 ? 1 : 0.05
        const dashPattern = THREE.MathUtils.lerp(1.0, rawDash, Math.pow(u, 0.6))

        const blurFade = Math.pow(Math.sin(u * Math.PI), 1.8)

        const fade1 = Math.pow(taper1, 1.4) * blurFade * dashPattern
        const fade2 = Math.pow(taper2, 1.4) * blurFade * dashPattern

        positions[ptr] = Math.cos(a1) * rad1
        positions[ptr + 1] = y1
        positions[ptr + 2] = Math.sin(a1) * rad1
        colors[ptr] = rCol * fade1
        colors[ptr + 1] = gCol * fade1
        colors[ptr + 2] = bCol * fade1
        ptr += 3

        positions[ptr] = Math.cos(a2) * rad2
        positions[ptr + 1] = y2
        positions[ptr + 2] = Math.sin(a2) * rad2
        colors[ptr] = rCol * fade2
        colors[ptr + 1] = gCol * fade2
        colors[ptr + 2] = bCol * fade2
        ptr += 3
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  // 2. Jet plasma biru
  const jetParticles = useMemo(() => {
    const count = 3500
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const h = (Math.random() - 0.5) * 19.0
      const spread = Math.abs(h) * 0.14
      const r = spread * Math.pow(Math.random(), 0.75)
      const angle = Math.random() * Math.PI * 2

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = h
      positions[i * 3 + 2] = Math.sin(angle) * r
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.y += delta * 0.45
    }
    if (jetRef.current) {
      jetRef.current.rotation.y -= delta * 0.25
    }
  })

  return (
    <group position={[4.5, 0.2, -1]} rotation={[0.35, -0.4, 0.15]} scale={0.85}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[-6, 8, 10]} intensity={1.5} color="#d4e4ff" />
      <pointLight position={[0, 0, 0]} intensity={6.5} color="#ffe5b4" distance={24} />

      {/* Pusat Hitam (Event Horizon) */}
      <mesh>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Photon Sphere & Penumpukan Inti Cahaya Terang */}
      <Glow size={3.4} color="#ffb742" opacity={1.0} />
      <Glow size={1.8} color="#ffffff" opacity={0.98} />

      {/* Cakram Akresi Utama dengan Ujung Meruncing Tajam */}
      <group ref={diskRef} rotation={[0.15, 0, 0]}>
        <lineSegments geometry={diskStreaks}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      </group>

      {/* Jet Relativistik Biru */}
      <group ref={jetRef}>
        <points geometry={jetParticles}>
          <pointsMaterial
            size={0.09}
            map={particleTexture}
            color="#7cd6ff"
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
        <Glow position={[0, 5.0, 0]} size={3.8} color="#4da6ff" opacity={0.8} />
        <Glow position={[0, -5.0, 0]} size={3.8} color="#4da6ff" opacity={0.8} />
      </group>
    </group>
  )
}