"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PromoPlacement } from "@/config/promos";
import type { PromoData } from "@/lib/promos";

type Ctx = { promos: PromoData[]; now: number | null };

const PromosContext = createContext<Ctx>({ promos: [], now: null });

export function PromosProvider({ promos, children }: { promos: PromoData[]; children: ReactNode }) {
  // Hasta que carga la página no se sabe la hora del visitante: recién ahí aparecen las promos
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const value = useMemo(() => ({ promos, now }), [promos, now]);
  return <PromosContext.Provider value={value}>{children}</PromosContext.Provider>;
}

/** A qué se está mirando: slugs de categorías (la propia y la madre) y de productos */
export type PromoTarget = { categories?: (string | null | undefined)[]; products?: string[] };

const isTargeted = (p: PromoData) => Boolean(p.categories?.length || p.products?.length);

function appliesTo(p: PromoData, target: PromoTarget) {
  if (!isTargeted(p)) return true;
  return Boolean(
    p.categories?.some((c) => target.categories?.includes(c)) ||
    p.products?.some((s) => target.products?.includes(s)),
  );
}

/**
 * Promos vigentes para un lugar de la web, de mayor a menor prioridad.
 * Con `target`, solo las que aplican a eso; `onlyTargeted` deja afuera las generales
 * (para los sellos de producto, que no tienen sentido en todos).
 */
export function usePromos(placement: PromoPlacement, target?: PromoTarget, onlyTargeted = false) {
  const { promos, now } = useContext(PromosContext);
  if (now === null) return [];
  return promos.filter((p) =>
    p.placements.includes(placement) &&
    (p.startsAt === null || p.startsAt <= now) &&
    (p.endsAt === null || now <= p.endsAt) &&
    (!onlyTargeted || isTargeted(p)) &&
    (!target || appliesTo(p, target)),
  );
}

const countdownFrom = 3 * 24 * 60 * 60 * 1000;

/** "Termina en 2 d 5 h": solo cuando faltan menos de 3 días */
export function Countdown({ endsAt, className = "promo-countdown" }: { endsAt: number | null; className?: string }) {
  const { now } = useContext(PromosContext);
  if (endsAt === null || now === null) return null;
  const left = endsAt - now;
  if (left <= 0 || left > countdownFrom) return null;
  const mins = Math.floor(left / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const parts = d > 0 ? `${d} d ${h} h` : h > 0 ? `${h} h ${m} min` : `${Math.max(m, 1)} min`;
  return <span className={className}>Termina en {parts}</span>;
}
