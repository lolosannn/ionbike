// Animación de carga: un ciclista que pedalea cada vez más rápido mientras carga la página
// y sale disparado cuando termina. El mismo código corre como script en línea (pantalla de
// carga inicial, antes de que cargue React) y dentro de app/loading.tsx (cambios de página).

/** Marcado SVG del ciclista. Los elementos con data-part los mueve runBikeLoader. */
export const bikeLoaderHtml = `
<div class="bike-loader-inner">
  <svg class="bike-loader-svg" viewBox="0 0 260 140" role="img" aria-label="Cargando">
    <g class="bl-speed" data-part="speed">
      <line x1="8" y1="48" x2="52" y2="48" />
      <line x1="20" y1="66" x2="58" y2="66" />
      <line x1="4" y1="84" x2="40" y2="84" />
    </g>
    <line class="bl-ground" data-part="ground" x1="0" y1="121" x2="260" y2="121" />
    <g data-part="rider">
      <g class="bl-leg-far" data-part="legFar"><polyline points="0,0 0,0 0,0" /></g>
      <g class="bl-wheel" data-part="wheelBack" transform="translate(70 97)">
        <circle r="23" /><line x1="-23" y1="0" x2="23" y2="0" /><line x1="0" y1="-23" x2="0" y2="23" />
        <line x1="-16" y1="-16" x2="16" y2="16" /><line x1="-16" y1="16" x2="16" y2="-16" />
      </g>
      <g class="bl-wheel" data-part="wheelFront" transform="translate(184 97)">
        <circle r="23" /><line x1="-23" y1="0" x2="23" y2="0" /><line x1="0" y1="-23" x2="0" y2="23" />
        <line x1="-16" y1="-16" x2="16" y2="16" /><line x1="-16" y1="16" x2="16" y2="-16" />
      </g>
      <g class="bl-frame">
        <polyline points="70,97 121,97 110,55 70,97" />
        <polyline points="110,55 162,58 184,97" />
        <line x1="121" y1="97" x2="164" y2="66" />
        <line x1="104" y1="52" x2="118" y2="52" />
        <polyline points="162,58 166,46 174,46" />
      </g>
      <g class="bl-crank" data-part="crank"><line x1="121" y1="97" x2="121" y2="85" /></g>
      <g class="bl-body">
        <line x1="112" y1="49" x2="148" y2="28" />
        <polyline points="146,30 158,44 172,47" />
        <circle class="bl-head" cx="158" cy="18" r="8.5" />
        <path class="bl-helmet" d="M148.5 16 a10 9 0 0 1 19 -1 l2 3 h-21 z" />
      </g>
      <g class="bl-leg-near" data-part="legNear"><polyline points="0,0 0,0 0,0" /></g>
    </g>
  </svg>
  <div class="bike-loader-bar"><span data-part="bar"></span></div>
  <p class="bike-loader-text">Preparando tu próxima rodada…</p>
</div>`;

type LoaderOptions = { splash: boolean };

/**
 * Anima el ciclista dentro de `root`. Devuelve una función para cortar la animación.
 * Tiene que ser autocontenida (sin referencias externas): se inyecta con toString().
 */
export function runBikeLoader(root: HTMLElement, opts: LoaderOptions) {
  const q = (name: string) => root.querySelector(`[data-part="${name}"]`) as SVGElement | HTMLElement | null;
  const parts = {
    rider: q("rider"), speed: q("speed"), ground: q("ground"), crank: q("crank"),
    wheelBack: q("wheelBack"), wheelFront: q("wheelFront"), bar: q("bar") as HTMLElement | null,
    legNear: q("legNear")?.querySelector("polyline"), legFar: q("legFar")?.querySelector("polyline"),
  };
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hip = { x: 112, y: 50 };
  const bb = { x: 121, y: 97 };
  const crankLen = 12, thigh = 31, shin = 31;
  // Vueltas de pedal por segundo: arranca tranquilo y se acerca de a poco al máximo
  const minSpeed = 0.5, maxSpeed = 2.4, dashSpeed = 5;
  const preview = opts.splash && /[?&]carga\b/.test(location.search);
  const start = performance.now();
  let last = start, angle = 0, wheel = 0, ground = 0, frame = 0;
  let finishing = 0; // momento en que terminó la carga
  let stopped = false;

  const leg = (el: Element | null | undefined, a: number) => {
    if (!el) return;
    const fx = bb.x + crankLen * Math.cos(a), fy = bb.y + crankLen * Math.sin(a);
    const dx = fx - hip.x, dy = fy - hip.y;
    const d = Math.min(Math.hypot(dx, dy), thigh + shin - 0.5);
    const base = Math.atan2(dy, dx);
    const bend = Math.acos((thigh * thigh + d * d - shin * shin) / (2 * thigh * d));
    // La rodilla va hacia adelante (el lado con x mayor)
    const k1 = { x: hip.x + thigh * Math.cos(base - bend), y: hip.y + thigh * Math.sin(base - bend) };
    const k2 = { x: hip.x + thigh * Math.cos(base + bend), y: hip.y + thigh * Math.sin(base + bend) };
    const k = k1.x > k2.x ? k1 : k2;
    el.setAttribute("points", `${hip.x},${hip.y} ${k.x.toFixed(1)},${k.y.toFixed(1)} ${fx.toFixed(1)},${fy.toFixed(1)}`);
  };

  const tick = (now: number) => {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now - start) / 1000;
    let speed = minSpeed + (maxSpeed - minSpeed) * (1 - Math.exp(-t / 2.2));
    let progress = 1 - Math.exp(-t / 2.6);
    let dash = 0;
    if (finishing) {
      dash = Math.min((now - finishing) / 550, 1);
      speed = maxSpeed + (dashSpeed - maxSpeed) * dash;
      progress = progress + (1 - progress) * Math.min(dash * 2, 1);
    }
    if (still) speed = 0;
    angle += speed * 2 * Math.PI * dt;
    wheel += speed * 2.6 * 360 * dt;
    ground -= speed * 90 * dt;
    const intensity = Math.min(speed / maxSpeed, 1.4);

    leg(parts.legNear, angle);
    leg(parts.legFar, angle + Math.PI);
    parts.crank?.setAttribute("transform", `rotate(${(angle * 180) / Math.PI + 90} ${bb.x} ${bb.y})`);
    parts.wheelBack?.setAttribute("transform", `translate(70 97) rotate(${wheel})`);
    parts.wheelFront?.setAttribute("transform", `translate(184 97) rotate(${wheel})`);
    parts.ground?.setAttribute("stroke-dashoffset", ground.toFixed(1));
    if (parts.speed) {
      parts.speed.style.opacity = String(Math.max(0, (intensity - 0.35) * 1.4));
      parts.speed.style.transform = `translateX(${(-6 * intensity).toFixed(1)}px)`;
    }
    // Salida final: el ciclista sale disparado hacia la derecha
    parts.rider?.setAttribute("transform", `translate(${(dash * dash * 320).toFixed(1)} 0)`);
    if (parts.bar) parts.bar.style.transform = `scaleX(${progress.toFixed(3)})`;

    if (finishing && dash >= 1) {
      stopped = true;
      root.classList.add("is-done");
      setTimeout(() => root.remove(), 400);
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  if (opts.splash) {
    // Solo se muestra si la carga tarda; si es rápida no aparece nunca
    const show = setTimeout(() => root.classList.add("is-visible"), preview ? 0 : 350);
    const finish = () => {
      if (!root.classList.contains("is-visible")) {
        stopped = true;
        clearTimeout(show);
        root.remove();
      } else if (!finishing) {
        finishing = performance.now();
      }
    };
    const onLoad = () => setTimeout(finish, preview ? 4500 : 0);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    // Por las dudas, nunca más de 10 segundos
    setTimeout(finish, 10000);
  }

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}
