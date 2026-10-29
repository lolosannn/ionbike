"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { PromoData } from "@/lib/promos";
import { ArrowIcon, ChevronIcon, PercentIcon } from "@/components/icons";
import { Countdown, usePromos } from "./PromosProvider";

function PromoLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a>;
}

/** Avanza solo cada `ms`, salvo que esté en pausa (mouse o foco encima) o haya un solo ítem */
function useRotation(count: number, ms: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => i + 1), ms);
    return () => clearInterval(id);
  }, [paused, count, ms]);
  const pause = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };
  return { index: count ? index % count : 0, go: (i: number) => setIndex(((i % count) + count) % count), pause };
}

/** Barra de arriba: las promos y los beneficios fijos, de a un mensaje por vez */
export function Topbar({ messages }: { messages: string[] }) {
  const promos = usePromos("barra");
  const items = [
    ...promos.map((p) => ({ key: p.id, text: p.title, href: p.href, cta: p.cta })),
    ...messages.map((m) => ({ key: m, text: m, href: undefined, cta: undefined })),
  ];
  const { index, go, pause } = useRotation(items.length, 4500);
  const item = items[index];
  if (!item) return null;

  return (
    <div className="topbar" {...pause}>
      <div className="container">
        {items.length > 1 && (
          <button type="button" className="topbar-arrow prev" aria-label="Mensaje anterior" onClick={() => go(index - 1)}>
            <ChevronIcon size={16} />
          </button>
        )}
        <span key={item.key} className="topbar-msg">
          {item.href ? (
            <PromoLink href={item.href}>
              <strong>{item.text}</strong>
              <span className="topbar-cta">{item.cta ?? "Ver más"} <ArrowIcon size={14} /></span>
            </PromoLink>
          ) : item.text}
        </span>
        {items.length > 1 && (
          <button type="button" className="topbar-arrow" aria-label="Mensaje siguiente" onClick={() => go(index + 1)}>
            <ChevronIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Una promo del banner del inicio (también la usa la vista previa del panel) */
export function PromoSlide({ p }: { p: PromoData }) {
  return (
    <div className="promo-slide">
      <div className="promo-slide-copy">
        <span className="promo-chip">{p.tag ?? "Promo"}</span>
        <h2 className="display">{p.title}</h2>
        {p.text && <p>{p.text}</p>}
        <div className="promo-slide-actions">
          {p.href && (
            <PromoLink href={p.href} className="btn btn-primary">{p.cta ?? "Ver promo"} <ArrowIcon /></PromoLink>
          )}
          <Countdown endsAt={p.endsAt} />
        </div>
      </div>
      <div className={`promo-slide-art${p.image ? " has-image" : ""}`} aria-hidden="true">
        {p.image ? <img src={p.image} alt="" /> : (
          <>
            <span className="promo-slide-word">{p.tag ?? "Promo"}</span>
            <span className="promo-slide-icon"><PercentIcon size={72} /></span>
          </>
        )}
      </div>
    </div>
  );
}

/** Banner grande del inicio: si hay varias promos, pasan solas */
export function PromoBanner() {
  const promos = usePromos("inicio");
  const { index, go, pause } = useRotation(promos.length, 7000);
  const p = promos[index];
  if (!p) return null;

  return (
    <section className="section container promo-hero" aria-roledescription="carrusel" aria-label="Promociones" {...pause}>
      <PromoSlide key={p.id} p={p} />
      {promos.length > 1 && (
        <div className="promo-dots">
          {promos.map((q, i) => (
            <button
              key={q.id}
              type="button"
              aria-label={`Promo ${i + 1} de ${promos.length}: ${q.title}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Tarjeta de promo que ocupa un lugar en la grilla de productos */
export function PromoCard({ promo }: { promo: PromoData }) {
  const body = (
    <>
      <span className="promo-chip">{promo.tag ?? "Promo"}</span>
      <strong className="promo-card-title">{promo.title}</strong>
      {promo.text && <p>{promo.text}</p>}
      <Countdown endsAt={promo.endsAt} />
      {promo.href && <span className="promo-card-cta">{promo.cta ?? "Ver promo"} <ArrowIcon /></span>}
      <span className="promo-card-mark" aria-hidden="true"><PercentIcon size={160} /></span>
    </>
  );
  return promo.href
    ? <PromoLink href={promo.href} className="promo-card">{body}</PromoLink>
    : <div className="promo-card">{body}</div>;
}

/** Sello en la foto de la tarjeta de producto */
export function PromoBadge({ slug, categories }: { slug: string; categories: (string | null | undefined)[] }) {
  const [promo] = usePromos("producto", { categories, products: [slug] }, true);
  if (!promo) return null;
  return <span className="badge badge-promo">{promo.tag ?? "Promo"}</span>;
}

/** Recuadro en la ficha del producto, debajo del precio */
export function PromoProductBox({ slug, categories }: { slug: string; categories: (string | null | undefined)[] }) {
  const promos = usePromos("producto", { categories, products: [slug] }, true);
  if (!promos.length) return null;
  return (
    <div className="pdp-promos">
      {promos.map((p) => (
        <div key={p.id} className="pdp-promo">
          <span className="promo-chip">{p.tag ?? "Promo"}</span>
          <div>
            <strong>{p.title}</strong>
            {p.text && <p>{p.text}</p>}
            <Countdown endsAt={p.endsAt} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Avisos arriba del carrito */
export function CartPromos() {
  const promos = usePromos("carrito");
  if (!promos.length) return null;
  return (
    <div className="cart-promos">
      {promos.map((p) => (
        <div key={p.id} className="cart-promo">
          <span className="cart-promo-icon"><PercentIcon size={22} /></span>
          <span className="cart-promo-text">
            <strong>{p.title}</strong>
            {p.text && <span>{p.text}</span>}
            <Countdown endsAt={p.endsAt} />
          </span>
          {p.href && <PromoLink href={p.href} className="cart-promo-link">{p.cta ?? "Ver promo"} <ArrowIcon size={16} /></PromoLink>}
        </div>
      ))}
    </div>
  );
}
