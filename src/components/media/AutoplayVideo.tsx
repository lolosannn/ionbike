"use client";

import { useEffect, useRef } from "react";

type Props = React.VideoHTMLAttributes<HTMLVideoElement>;

/**
 * Video sin sonido que se reproduce solo mientras está a la vista (y se pausa al salir),
 * así no consume datos si nadie lo mira. Con "movimiento reducido" no arranca solo.
 */
export function AutoplayVideo(props: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <video ref={ref} muted loop playsInline preload="none" {...props} />;
}
