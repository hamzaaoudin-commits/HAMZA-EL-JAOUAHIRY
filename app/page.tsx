import World from '@/components/World'

export default function Home() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '200vh' }}>
      <World />
      <div className="vignette" />
      <div className="grain" />

      <section
        style={{
          position: 'relative',
          zIndex: 5,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 3rem',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--signal)',
            marginBottom: '1.5rem',
          }}
        >
          Palier 1 · La scène vit
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-d)',
            fontWeight: 800,
            fontSize: 'clamp(3rem, 9vw, 8rem)',
            lineHeight: 0.96,
            letterSpacing: '-0.02em',
          }}
        >
          Hamza
          <br />
          <span style={{ color: 'var(--signal)' }}>El Jaouahiry</span>
        </h1>
        <p
          style={{
            marginTop: '2rem',
            maxWidth: '46ch',
            fontSize: '1.1rem',
            color: 'var(--text-2)',
          }}
        >
          Si tu vois le cristal tourner avec ses arêtes crimson qui rayonnent et la
          parallaxe à la souris — le moteur 3D fonctionne. On peut passer au palier 2.
        </p>
      </section>
    </main>
  )
}
