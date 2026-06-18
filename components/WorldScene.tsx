'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
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

// ---- EXACT port of the HTML radial sprite textures ----
function radialTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(220,70,95,0.9)')
  g.addColorStop(0.25, 'rgba(192,48,73,0.4)')
  g.addColorStop(1, 'rgba(192,48,73,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}
function whiteTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,235,238,0.95)')
  g.addColorStop(0.22, 'rgba(240,100,120,0.5)')
  g.addColorStop(1, 'rgba(192,48,73,0)')
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

// Builds the whole scene as one THREE.Group, exactly like the HTML, then drives it each frame.
function WorldContent() {
  const { camera, clock } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const built = useMemo(() => {
    const root = new THREE.Group()

    // ---- crystalGroup: the crystal that shatters (EXACT HTML) ----
    const crystalGroup = new THREE.Group()
    crystalGroup.scale.set(1, 1.18, 1)
    root.add(crystalGroup)

    const baseGeo = new THREE.IcosahedronGeometry(4, 1).toNonIndexed()
    const bp = baseGeo.attributes.position.array as ArrayLike<number>
    const frags: Frag[] = []
    for (let i = 0; i < bp.length; i += 9) {
      const a = new THREE.Vector3(bp[i], bp[i + 1], bp[i + 2])
      const b = new THREE.Vector3(bp[i + 3], bp[i + 4], bp[i + 5])
      const c = new THREE.Vector3(bp[i + 6], bp[i + 7], bp[i + 8])
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
      const m = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({
          color: 0x0f0f12, metalness: 0.55, roughness: 0.3,
          flatShading: true, transparent: true, opacity: 1, side: THREE.DoubleSide,
        })
      )
      m.position.copy(ctr)
      crystalGroup.add(m)
      frags.push({
        mesh: m,
        home: ctr.clone(),
        dir: ctr.clone().normalize(),
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        spin: Math.random() * 2 + 1,
      })
    }

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(4, 1)),
      new THREE.LineBasicMaterial({ color: 0xc03049, transparent: true, opacity: 0.45 })
    )
    crystalGroup.add(edges)

    // ---- halo sprite (EXACT HTML) ----
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialTex(), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8,
      })
    )
    halo.scale.set(22, 22, 1)
    root.add(halo)

    // ---- diamond hidden at the core (EXACT HTML) ----
    const diaGeo = new THREE.OctahedronGeometry(1.7, 0)
    const diamond = new THREE.Mesh(
      diaGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf5ede4, metalness: 0.92, roughness: 0.07,
        flatShading: true, emissive: 0x4a1020, emissiveIntensity: 0.55,
      })
    )
    diamond.scale.setScalar(0.001)
    crystalGroup.add(diamond)
    const diaEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(diaGeo),
      new THREE.LineBasicMaterial({ color: 0xff7e92, transparent: true, opacity: 0 })
    )
    diamond.add(diaEdges)

    const diaHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: whiteTex(), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
      })
    )
    diaHalo.scale.set(12, 12, 1)
    crystalGroup.add(diaHalo)

    // ---- explosion sparks (EXACT HTML) ----
    const SN = 170
    const sp = new Float32Array(SN * 3)
    for (let i = 0; i < SN; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    const sparks = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        color: 0xff7e92, size: 0.12, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    )
    crystalGroup.add(sparks)

    // ---- depth dust (EXACT HTML) ----
    const DN = 600
    const dp = new Float32Array(DN * 3)
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 90
      dp[i * 3 + 1] = (Math.random() - 0.5) * 60
      dp[i * 3 + 2] = (Math.random() - 0.5) * 120 - 20
    }
    const dg = new THREE.BufferGeometry()
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3))
    const dust = new THREE.Points(
      dg,
      new THREE.PointsMaterial({ color: 0xedeae4, size: 0.06, transparent: true, opacity: 0.32, depthWrite: false })
    )
    root.add(dust)

    return { root, crystalGroup, edges, halo, diamond, diaEdges, diaHalo, sparks, dust, frags }
  }, [])

  useFrame(() => {
    const t = clock.elapsedTime
    const prog = getProgress()
    const ex = smooth(0.85, 1.0, prog)
    const p = mouseFromPointer()
    mouse.current.x += (p.x - mouse.current.x) * 0.04
    mouse.current.y += (p.y - mouse.current.y) * 0.04

    const z = 32 - prog * 25
    camera.position.set(mouse.current.x * 5, -mouse.current.y * 4, z)
    camera.lookAt(0, 0, 0)

    const { crystalGroup, edges, halo, diamond, diaEdges, diaHalo, sparks, dust, frags } = built

    crystalGroup.rotation.y += 0.0022
    crystalGroup.rotation.x = Math.sin(t * 0.4) * 0.06 + prog * 0.5
    dust.rotation.y += 0.0003
    ;(halo.material as THREE.SpriteMaterial).opacity = (0.55 + Math.sin(t * 1.6) * 0.08) * (1 - ex)

    for (const f of frags) {
      tmp.copy(f.home).addScaledVector(f.dir, ex * 16)
      f.mesh.position.copy(tmp)
      const r = ex * f.spin * 4
      f.mesh.rotation.set(f.axis.x * r, f.axis.y * r, f.axis.z * r)
      ;(f.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - Math.min(1, ex * 1.4)
    }
    ;(edges.material as THREE.LineBasicMaterial).opacity = 0.45 * (1 - Math.min(1, ex * 2))

    diamond.scale.setScalar(Math.max(0.001, ex * 2.0))
    diamond.rotation.y += 0.01 + ex * 0.05
    diamond.rotation.x = Math.sin(t * 0.6) * 0.1
    ;(diaEdges.material as THREE.LineBasicMaterial).opacity = ex
    ;(diaHalo.material as THREE.SpriteMaterial).opacity = ex * 0.85
    diaHalo.scale.setScalar(10 + ex * 9)

    sparks.scale.setScalar(4 + ex * 13)
    ;(sparks.material as THREE.PointsMaterial).opacity = Math.max(0, ex * (1 - ex) * 4) * 0.9
    ;(sparks.material as THREE.PointsMaterial).size = 0.12 + ex * 0.14
  })

  return <primitive object={built.root} />
}

// pointer tracking (replaces the HTML pointermove handler)
const _pointer = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    _pointer.x = e.clientX / window.innerWidth - 0.5
    _pointer.y = e.clientY / window.innerHeight - 0.5
  })
}
function mouseFromPointer() {
  return _pointer
}


export default function WorldScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 32], fov: 52 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      {/* lights — EXACT HTML values */}
      <ambientLight color={0x1a1c22} intensity={0.7} />
      <pointLight color={0xc03049} intensity={70} distance={60} position={[10, 4, 12]} />
      <directionalLight color={0xaebccd} intensity={1.25} position={[-8, 6, -4]} />
      <pointLight color={0x33405e} intensity={28} distance={60} position={[-7, -5, 8]} />

      <WorldContent />

    </Canvas>
  )
}
