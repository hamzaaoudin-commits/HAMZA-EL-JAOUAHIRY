import World from '@/components/World'
import Stations from '@/components/Stations'

export default function Home() {
  return (
    <>
      <World />
      <div className="glow" />
      <div className="vignette" />
      <div className="grain" />
      <Stations />
    </>
  )
}
