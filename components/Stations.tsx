'use client'

import { useEffect, useState } from 'react'
import { HERO, ABOUT, PARCOURS, BOOK, ESSENCE, CHAPTERS } from '@/app/content'

export default function Stations() {
  const [chapter, setChapter] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // reveal-on-scroll
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('rv-in')
        })
      },
      { threshold: 0.18 }
    )
    document.querySelectorAll('.rv').forEach((el) => obs.observe(el))

    // chapter indicator + progress bar
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setProgress(p)
      setChapter(Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length + 0.001)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      obs.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      {/* progress + chapter indicator */}
      <div className="hud">
        <span className="hud-ch">
          {String(chapter + 1).padStart(2, '0')} · {CHAPTERS[chapter]}
        </span>
        <div className="hud-bar">
          <div className="hud-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <main className="world">
        {/* I. INTRODUCTION */}
        <section className="station">
          <span className="eyebrow rv">{HERO.eyebrow}</span>
          <h1 className="rv d2">
            {HERO.name1}
            <br />
            <span className="grad">{HERO.name2}</span>
          </h1>
          <p className="tag rv d3">{HERO.lead}</p>
          <p className="tag dim rv d4">{HERO.sub}</p>
          <div className="cue rv d5">{HERO.cue}</div>
        </section>

        {/* II. À PROPOS */}
        <section className="station center">
          <span className="eyebrow rv">{ABOUT.eyebrow}</span>
          <h2 className="lead rv d2">
            {ABOUT.lead1}
            <br />
            <span className="grad">{ABOUT.lead2}</span>
          </h2>
          <p className="tag center-tag rv d3">{ABOUT.body}</p>
        </section>

        {/* III. PARCOURS */}
        <section className="station">
          <span className="eyebrow rv">{PARCOURS.eyebrow}</span>
          <p className="tag rv" style={{ margin: '0 0 2.6rem', maxWidth: '44ch' }}>
            {PARCOURS.intro}
          </p>
          <div className="orbit rv d2">
            {PARCOURS.items.map((it) => (
              <div className="place" key={it.n}>
                <span className="n">{it.n}</span>
                <span>
                  <span className="ttl">{it.title}</span>
                  <span className="d">{it.desc}</span>
                </span>
                <span className="y">{it.year}</span>
              </div>
            ))}
          </div>
        </section>

        {/* IV. LE LIVRE */}
        <section className="station">
          <div className="book">
            <div className="book-cover rv">
              <span className="bc-top">{BOOK.coverTop}</span>
              <div>
                <div className="bc-title">
                  {BOOK.coverTitle.split('\n').map((l, i) => (
                    <span key={i}>
                      {l}
                      <br />
                    </span>
                  ))}
                </div>
                <div className="bc-sub">{BOOK.coverSub}</div>
              </div>
              <span className="bc-author">{BOOK.coverAuthor}</span>
            </div>
            <div className="book-info">
              <span className="eyebrow rv">{BOOK.eyebrow}</span>
              <h2 className="rv d2">{BOOK.title}</h2>
              <p className="rv d3">{BOOK.body}</p>
              <div className="book-meta rv d4">
                {BOOK.meta.map((m) => (
                  <div key={m.label}>
                    <span className="ml">{m.label}</span>
                    {m.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* V. ESSENCE */}
        <section className="station center">
          <span className="eyebrow rv">{ESSENCE.eyebrow}</span>
          <h2 className="lead rv d2">
            {ESSENCE.lead1}
            <br />
            <span className="grad">{ESSENCE.lead2}</span>
          </h2>
          <p className="tag center-tag rv d3">{ESSENCE.body}</p>
          <div className="contact rv d4">
            <a href={`mailto:${ESSENCE.email}`}>{ESSENCE.email}</a>
            <a href={`tel:${ESSENCE.phone.replace(/\s/g, '')}`}>{ESSENCE.phone}</a>
            <span className="loc">{ESSENCE.location}</span>
          </div>
        </section>
      </main>
    </>
  )
}
