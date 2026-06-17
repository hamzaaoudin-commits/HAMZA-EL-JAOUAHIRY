'use client'

import dynamic from 'next/dynamic'

// load the WebGL scene only in the browser — never during SSR/build
const WorldScene = dynamic(() => import('./WorldScene'), { ssr: false })

export default function World() {
  return <WorldScene />
}
