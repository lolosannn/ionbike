"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons";

export type Slide = { src: string; mobileSrc?: string | null; alt: string; href?: string };

const interval = 5000;

/** Carrusel del inicio: pasa solo cada 5 s, con flechas, puntos y deslizando con el dedo. */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setCurrent((i + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => go(current + 1), interval);
    return () => clearTimeout(id);
  }, [current, paused, count, go]);

  if (count === 0) return null;

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carrusel"
      aria-label="Promociones"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((s, i) => {
          const image = (
            <picture>
              {s.mobileSrc && <source media="(max-width: 700px)" srcSet={s.mobileSrc} />}
              <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
            </picture>
          );
          return (
            <div key={s.src} className={`hero-slide${s.mobileSrc ? " has-mobile" : ""}`} role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${count}`} aria-hidden={i !== current}>
              {s.href ? <Link href={s.href} tabIndex={i === current ? 0 : -1}>{image}</Link> : image}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button type="button" className="hero-arrow prev" aria-label="Anterior" onClick={() => go(current - 1)}>
            <ChevronIcon size={26} />
          </button>
          <button type="button" className="hero-arrow next" aria-label="Siguiente" onClick={() => go(current + 1)}>
            <ChevronIcon size={26} />
          </button>
          <div className="hero-dots">
            {slides.map((s, i) => (
              <button key={s.src} type="button" aria-label={`Ir a la ${i + 1}`} aria-current={i === current} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
