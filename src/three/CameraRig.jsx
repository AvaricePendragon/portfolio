import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GALAXY_CENTER, SOLAR_CENTER, WRITING_CENTER } from '../config'

const VIEWS = {
  '/':         { pos: [-24, 13.5, 58],   look: [3, 10.0, 38] },
  '/projects': { pos: [-7, 13.5, -47],   look: [1.5, 7.6, -70] }, // <-- Pastikan koordinat ini digunakan
  '/writing':  { pos: [13.5, 38, 0.01],  look: [13.5, 0, 0] },
  '/cabinet':  { pos: [24, 11.2, 26],    look: [36, SOLAR_CENTER[1], 13] },
  '/contact':  { pos: [28, 12.0, 30],    look: [36, SOLAR_CENTER[1], 13] },
}

export default function CameraRig({ path }) {
  const controls = useRef()
  const animating = useRef(true)
  const goal = useRef(new THREE.Vector3())
  const width = useThree((s) => s.size.width)
  const isLocked = path === '/writing'

  useEffect(() => {
    animating.current = true
  }, [path, width])

  useFrame(({ camera, size }, dt) => {
    const c = controls.current
    if (!c || !animating.current) return

    const v = VIEWS[path] ?? VIEWS['/']
    const speed = 2.5

    const aspect = size.width / size.height
    const k = !isLocked && aspect < 1.2 ? Math.min(2, 1 + (1.2 - aspect) * 0.9) : 1

    goal.current.set(
      v.look[0] + (v.pos[0] - v.look[0]) * k,
      v.look[1] + (v.pos[1] - v.look[1]) * k,
      v.look[2] + (v.pos[2] - v.look[2]) * k
    )

    camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.current.x, speed, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.current.y, speed, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.current.z, speed, dt)

    c.target.x = THREE.MathUtils.damp(c.target.x, v.look[0], speed, dt)
    c.target.y = THREE.MathUtils.damp(c.target.y, v.look[1], speed, dt)
    c.target.z = THREE.MathUtils.damp(c.target.z, v.look[2], speed, dt)

    if (isLocked) {
      camera.up.set(0, 1, 0)
      camera.lookAt(c.target)
    }

    if (camera.position.distanceTo(goal.current) < 0.02) {
      camera.position.copy(goal.current)
      c.target.set(...v.look)
      if (isLocked) camera.lookAt(c.target)
      animating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!isLocked}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      minDistance={4}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2 - 0.02}
      onStart={() => { animating.current = false }}
    />
  )
}