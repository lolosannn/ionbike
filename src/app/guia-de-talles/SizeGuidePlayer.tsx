"use client";

import { useRef, useState } from "react";

// Segundo en que arranca cada parte del video propio (video/guia-de-talles/index.html)
const chapters = [
  { label: "Qué necesitás", at: 4.9 },
  { label: "Altura", at: 14 },
  { label: "Entrepierna", at: 29.2 },
  { label: "Tipo de bici", at: 42.5 },
  { label: "Tu talle", at: 52.6 },
  { label: "Comprobalo", at: 64.25 },
];

/** Video de la guía con capítulos para saltar directo a cada paso. */
export function SizeGuidePlayer({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const current = chapters.findLastIndex((c) => time >= c.at);

  const jump = (at: number) => {
    const video = ref.current;
    if (!video) return;
    video.currentTime = at;
    video.play().catch(() => {});
  };

  return (
    <>
      <video
        ref={ref}
        className="video-frame"
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        aria-label="Cómo medirte y elegir el talle de tu bici"
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
      <div className="video-chapters">
        <span className="eyebrow">Saltá a</span>
        <div className="video-chapters-list">
          {chapters.map((c, i) => (
            <button key={c.label} type="button" className="pill" aria-pressed={i === current} onClick={() => jump(c.at)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
