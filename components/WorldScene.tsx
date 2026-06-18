'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function getProgress() {
  if (typeof window === 'undefined') return 0
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}
function smooth(a: number, b: number, x: number) {
  x = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

// ---- radial sprite texture (halo) drawn on a canvas ----
function radialTexture(stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  for (const [o, col] of stops) g.addColorStop(o, col)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

type Frag = {
  mesh: THREE.Mesh
  home: THREE.Vector3
  dir: THREE.Vector3
  axis: THREE.Vector3
  spin: number
}

// ---------- atmosphere: starfield ----------
function Stars() {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const N = 700
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      // distribute in a large spherical shell behind the scene
      const r = 30 + Math.random() * 90
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
      pos[i * 3 + 2] = -20 - Math.random() * 120
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0002
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#EDEAE4" size={0.05} sizeAttenuation transparent opacity={0.18} depthWrite={false} />
    </points>
  )
}

// ---------- crystal + shatter + diamond ----------
function World3D() {
  const group = useRef<THREE.Group>(null!)
  const solid = useRef<THREE.Mesh>(null!)
  const diamond = useRef<THREE.Mesh>(null!)
  const diamondEdges = useRef<THREE.LineSegments>(null!)
  const diamondHalo = useRef<THREE.Sprite>(null!)
  const edges = useRef<THREE.LineSegments>(null!)
  const glow = useRef<THREE.Mesh>(null!)
  const sparks = useRef<THREE.Points>(null!)
  const mouse = useRef({ x: 0, y: 0 })
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const diamondHaloTex = useMemo(
    () =>
      radialTexture([
        [0, 'rgba(255,225,230,0.55)'],
        [0.25, 'rgba(220,90,110,0.28)'],
        [1, 'rgba(160,40,60,0)'],
      ]),
    []
  )

  // one clean solid icosahedron for the whole journey
  const solidGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(3.4, 5) // dense facets
    const pos = g.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    // subtle crystalline displacement so it scintillates instead of being a smooth ball
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = Math.sin(v.x * 2.1) * Math.cos(v.y * 1.7) * Math.sin(v.z * 2.4)
      const k = 1 + n * 0.05
      v.multiplyScalar(k)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [])
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.45, 2), 18), [])
  const diaGeo = useMemo(() => new THREE.OctahedronGeometry(1.7, 0), [])

  // separate fragments, hidden until the explosion
  const { frags, shellGroup, sparkGeo } = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(3.5, 1)
    const pos = base.attributes.position.array as ArrayLike<number>
    const frags: Frag[] = []
    const shellGroup = new THREE.Group()
    shellGroup.visible = false

    for (let i = 0; i < pos.length; i += 9) {
      const a = new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2])
      const b = new THREE.Vector3(pos[i + 3], pos[i + 4], pos[i + 5])
      const c = new THREE.Vector3(pos[i + 6], pos[i + 7], pos[i + 8])
      const ctr = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3)
      const g = new THREE.BufferGeometry()
      g.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array([
            a.x - ctr.x, a.y - ctr.y, a.z - ctr.z,
            b.x - ctr.x, b.y - ctr.y, b.z - ctr.z,
            c.x - ctr.x, c.y - ctr.y, c.z - ctr.z,
          ]),
          3
        )
      )
      g.computeVertexNormals()
      const m = new THREE.MeshStandardMaterial({
        color: 0x0f0f12, metalness: 0.6, roughness: 0.28,
        flatShading: true, transparent: true, opacity: 1,
      })
      const mesh = new THREE.Mesh(g, m)
      mesh.position.copy(ctr)
      shellGroup.add(mesh)
      frags.push({
        mesh,
        home: ctr.clone(),
        dir: ctr.clone().normalize(),
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        spin: Math.random() * 2 + 1,
      })
    }

    const SN = 220
    const sp = new Float32Array(SN * 3)
    for (let i = 0; i < SN; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))

    return { frags, shellGroup, sparkGeo }
  }, [])

  useFrame((state) => {
    const prog = getProgress()
    const ex = smooth(0.82, 1.0, prog)
    const p = state.pointer
    mouse.current.x += (p.x - mouse.current.x) * 0.04
    mouse.current.y += (p.y - mouse.current.y) * 0.04

    if (group.current) {
      group.current.rotation.y += 0.0024
      group.current.rotation.x = mouse.current.y * 0.35 + prog * 0.5
      group.current.rotation.z = mouse.current.x * 0.18
    }

    // before the explosion: clean solid crystal. during: switch to fragments.
    const exploding = ex > 0.001
    if (solid.current) solid.current.visible = !exploding
    if (edges.current) edges.current.visible = !exploding
    if (glow.current) glow.current.visible = !exploding
    shellGroup.visible = exploding

    if (exploding) {
      for (const f of frags) {
        tmp.copy(f.home).addScaledVector(f.dir, ex * 20)
        f.mesh.position.copy(tmp)
        const r = ex * f.spin * 5
        f.mesh.rotation.set(f.axis.x * r, f.axis.y * r, f.axis.z * r)
        ;(f.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - Math.min(1, ex * 1.35)
      }
    }

    if (diamond.current) {
      diamond.current.scale.setScalar(Math.max(0.001, ex * 2.1))
      diamond.current.rotation.y += 0.01 + ex * 0.06
      diamond.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.12
    }
    if (diamondEdges.current) {
      ;(diamondEdges.current.material as THREE.LineBasicMaterial).opacity = ex
    }
    if (diamondHalo.current) {
      diamondHalo.current.material.opacity = ex * 0.5
      diamondHalo.current.scale.setScalar(8 + ex * 6)
    }
    if (sparks.current) {
      sparks.current.scale.setScalar(4 + ex * 16)
      const mat = sparks.current.material as THREE.PointsMaterial
      mat.opacity = Math.max(0, ex * (1 - ex) * 4) * 0.95
      mat.size = 0.14 + ex * 0.16
    }
  })

  return (
    <group ref={group} scale={[1, 1.18, 1]}>
      {/* clean solid crystal for the whole journey */}
      <mesh ref={solid} geometry={solidGeo}>
        <meshStandardMaterial
          color="#141318"
          metalness={0.85}
          roughness={0.18}
          flatShading={false}
          envMapIntensity={1.4}
        />
      </mesh>
      <lineSegments ref={edges} geometry={edgeGeo}>
        <lineBasicMaterial color="#C03049" transparent opacity={0.4} />
      </lineSegments>

      {/* crimson rim glow hugging the crystal — backside shell, soft, never a flat disc */}
      <mesh ref={glow} scale={1.28}>
        <icosahedronGeometry args={[3.4, 5]} />
        <meshBasicMaterial
          color="#C03049"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* fragments — only shown during the explosion */}
      <primitive object={shellGroup} />

      <mesh ref={diamond} scale={0.001}>
        <octahedronGeometry args={[1.7, 0]} />
        <meshStandardMaterial
          color="#F5EDE4" metalness={0.92} roughness={0.06}
          flatShading emissive="#4a1020" emissiveIntensity={0.5}
        />
        <lineSegments ref={diamondEdges}>
          <edgesGeometry args={[diaGeo]} />
          <lineBasicMaterial color="#FF7E92" transparent opacity={0} />
        </lineSegments>
      </mesh>

      <sprite ref={diamondHalo} scale={[8, 8, 1]}>
        <spriteMaterial map={diamondHaloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </sprite>

      <points ref={sparks} geometry={sparkGeo}>
        <pointsMaterial color="#FF7E92" size={0.14} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

function Rig() {
  const mouse = useRef({ x: 0, y: 0 })
  useFrame((state) => {
    const prog = getProgress()
    const p = state.pointer
    mouse.current.x += (p.x - mouse.current.x) * 0.04
    mouse.current.y += (p.y - mouse.current.y) * 0.04
    const z = 32 - prog * 25
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
      <pointLight color="#C03049" intensity={110} distance={70} position={[10, 4, 12]} />
      <directionalLight color="#aebccd" intensity={1.6} position={[-8, 6, -4]} />
      <directionalLight color="#ff90a4" intensity={0.8} position={[6, -3, 6]} />
      <pointLight color="#33405e" intensity={42} distance={60} position={[-7, -5, 8]} />

      <Stars />
      <World3D />
      <Rig />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
