import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Tesseract({ active }) {
  const groupRef = useRef()

  const { framesGeo, linesGeo } = useMemo(() => {
    const framePositions = []
    const linePositions = []

    const layers = 10
    for (let i = 0; i < layers; i++) {
      const scale = 1.0 + i * 0.6
      const depth = (i - layers / 2) * 1.5

      const w = 3.8 * scale
      const h = 2.8 * scale

      const corners = [
        [-w, -h, depth], [w, -h, depth],
        [w, h, depth], [-w, h, depth],
      ]

      if (i < layers - 1) {
        const nextScale = 1.0 + (i + 1) * 0.6
        const nextDepth = ((i + 1) - layers / 2) * 1.5
        const nw = 3.8 * nextScale
        const nh = 2.8 * nextScale

        const nextCorners = [
          [-nw, -nh, nextDepth], [nw, -nh, nextDepth],
          [nw, nh, nextDepth], [-nw, nh, nextDepth],
        ]

        for (let c = 0; c < 4; c++) {
          linePositions.push(...corners[c], ...nextCorners[c])
        }
      }
    }

    const fg = new THREE.BoxGeometry(0.3, 0.2, 0.1)
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

    return { framesGeo: fg, linesGeo: lg }
  }, [])

  const booksData = useMemo(() => {
    const items = []
    const palettes = ['#c47743', '#8a4c25', '#e8aa74', '#363b45', '#525b6b', '#d4af37']
    
    for (let i = 0; i < 70; i++) {
      items.push({
        pos: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 14,
        ],
        rot: [Math.random() * 0.2, Math.random() * Math.PI, 0],
        scale: [0.1 + Math.random() * 0.12, 0.4 + Math.random() * 0.3, 0.3 + Math.random() * 0.2],
        color: palettes[Math.floor(Math.random() * palettes.length)],
      })
    }
    return items
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.06) * 0.15
      groupRef.current.rotation.x = Math.cos(t * 0.05) * 0.1
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef} position={[24, 6, -10]}>
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 4, 3]} intensity={3.0} color="#ffd166" distance={25} />
      <pointLight position={[0, -4, 3]} intensity={2.2} color="#4db8ff" distance={25} />

      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#b8c2d6" transparent opacity={0.25} />
      </lineSegments>

      {booksData.map((b, idx) => (
        <mesh key={idx} position={b.pos} rotation={b.rot} scale={b.scale} geometry={framesGeo}>
          <meshStandardMaterial color={b.color} roughness={0.45} metalness={0.25} />
        </mesh>
      ))}
    </group>
  )
}