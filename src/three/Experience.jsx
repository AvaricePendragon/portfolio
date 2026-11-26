import { Canvas } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'
import Stars from './Stars'
import CameraRig from './CameraRig'
import GalaxyCluster from './GalaxyCluster'
import MilkyWay from './MilkyWay'
import SolarSystem from './SolarSystem'
import Orbits from './Orbits'
import Lensing from './Lensing'
import Wormhole from './Wormhole'
import { GALAXY_CENTER, SOLAR_CENTER, WRITING_CENTER, LENS_CENTER } from '../config'

const WORMHOLE_CENTER = [3.2, -0.4, 0]

export default function Experience() {
    const { pathname } = useLocation()
    // '/writing/judul-tulisan' → '/writing' (adegan ditentukan bagian pertama alamat)
    const section = '/' + (pathname.split('/')[1] ?? '')

    return (
            <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [-24, 13.5, 58], fov: 55 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
            <color attach="background" args={['#050507']} />
                <fog attach="fog" args={['#050507', 55, 165]} />

            <Stars />
                {section !== '/' && (
                <gridHelper args={[450, 75, '#262630', '#14141a']} position={[0, -3, 0]} />
            )}

            {section === '/' && (
                <group position={LENS_CENTER}>
                    <Lensing active />
                </group>
            )}

            {section === '/projects' && (
                <group position={GALAXY_CENTER}>
                    <Wormhole active={section === '/projects'} />
                </group>
            )}

            {section === '/writing' && (
                <group position={WRITING_CENTER}>
                    <Orbits active />
                </group>
            )}

            {section === '/cabinet' && (
                <group position={SOLAR_CENTER}>
                    <SolarSystem active />
                </group>
            )}

            <CameraRig path={section} />
        </Canvas>
    )
}