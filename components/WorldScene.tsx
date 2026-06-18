'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// shared scroll progress 0..1, read by the scene each frame
function getProgress() {
  if (typeof window === 'undefined') return 0
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

function Crystal() {
  const group = useRef<THREE.Group>(null!)
  const mouse = useRef({ x: 0, y: 0 })

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.5, 1)),
    []
  )

  useFrame((state) => {
    const p = state.pointer
    mouse.current.x += (p.x - mouse.current.x) * 0.04
    mouse.current.y += (p.y - mouse.current.y) * 0.04
    if (group.current) {
      group.current.rotation.y += 0.0024
      group.current.rotation.x = mouse.current.y * 0.35 + getProgress() * 0.5
      group.current.rotation.z = mouse.current.x * 0.18
    }
  })

  return (
    <group ref={group} scale={[1, 1.18, 1]}>
      <mesh>
        <icosahedronGeometry args={[3.5, 1]} />
        <meshStandardMaterial color="#0f0f12" metalness={0.55} roughness={0.3} flatShading />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#C03049" transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

// the travelling: camera flies toward the crystal as you scroll
function Rig() {
  const mouse = useRef({ x: 0, y: 0 })
  useFrame((state) => {
    const prog = getProgress()
    const p = state.pointer
    mouse.current.x += (p.x - mouse.current.x) * 0.04
    mouse.current.y += (p.y - mouse.current.y) * 0.04
    const z = 32 - prog * 25 // 32 → 7
    state.camera.position.set(mouse.current.x * 5, -mouse.current.y * 4, z)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export default function WorldScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 32], fov: 52 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <ambientLight color="#1a1c22" intensity={0.7} />
      <pointLight color="#C03049" intensity={120} distance={90} position={[10, 4, 12]} />
      <directionalLight color="#aebccd" intensity={1.25} position={[-8, 6, -4]} />
      <pointLight color="#33405e" intensity={60} distance={90} position={[-7, -5, 8]} />

      <Crystal />
      <Rig />

      <EffectComposer>
        <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
