"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { PromoData } from "@/lib/promos";
import { placementInfo, promoStatus, promoStatusLabels, validatePromo, type PromoForm } from "@/lib/admin/promo-form";
import { PromoCard, PromoSlide } from "@/components/promos/Promos";
import { ImagesField } from "./ImagesField";
import { dateRange } from "./PromosList";

type Targets = { products: { slug: string; name: string; active: boolean }[]; categories: { slug: string; name: string }[] };

type Props = {
  initial: PromoForm;
  today: string;
  targets: Targets;
  save?: (form: PromoForm) => Promise<{ ok: boolean; id?: string; error?: string; field?: string }>;
  remove?: (id: string) => Promise<{ ok: boolean; error?: string }>;
};

const previewTabs = { inicio: "Banner", barra: "Barra", listado: "Tarjeta", producto: "Sello" } as const;

const linkSuggestions = ["/ofertas", "/categoria/bicicletas", "/categoria/repuestos", "/categoria/accesorios", "/categoria/indumentaria", "/taller", "/guia-de-talles"];

async function upload(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/admin/api/fotos", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo subir la foto.");
  return data.url;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function PromoEditor({ initial, today, targets, save, remove }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [preview, setPreview] = useState<"inicio" | "barra" | "listado" | "producto">("inicio");
  const [productQuery, setProductQuery] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k: "placements" | "categories" | "products", v: string) =>
    setForm((f) => ({ ...f, [k]: (f[k] as string[]).includes(v) ? (f[k] as string[]).filter((x) => x !== v) : [...f[k], v] }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = promoStatus(form, today);
  const previewData: PromoData = {
    id: form.id || "vista-previa",
    title: form.title || "Título de la promo",
    text: form.text || undefined,
    tag: form.tag || undefined,
    href: form.href || "#",
    cta: form.cta || undefined,
    image: form.image || null,
    placements: form.placements,
    startsAt: null,
    endsAt: null,
  };
  const products = useMemo(() => {
    const q = normalize(productQuery.trim());
    return targets.products.filter((p) => form.products.includes(p.slug) || (q && normalize(p.name).includes(q))).slice(0, 40);
  }, [productQuery, targets.products, form.products]);

  const submit = () => {
    const check = validatePromo(form);
    if (!check.ok) {
      setErrorField(check.field);
      return setMessage({ kind: "error", text: check.error });
    }
    setErrorField(undefined);
    if (!save) {
      setSaved(form);
      return setMessage({ kind: "info", text: "Vista previa: así quedaría guardada. En la tienda real aparece al instante en los lugares elegidos." });
    }
    start(async () => {
      const res = await save(form);
      if (!res.ok) {
        setErrorField(res.field);
        return setMessage({ kind: "error", text: res.error ?? "No se pudo guardar." });
      }
      const next = { ...form, id: res.id ?? form.id };
      setForm(next);
      setSaved(next);
      setMessage({ kind: "ok", text: form.id ? "Cambios guardados. Ya se ven en la tienda." : "Promo creada." });
      if (!form.id && res.id) router.replace(`/admin/promociones/${res.id}`);
    });
  };

  const doDelete = () => {
    if (!remove) return setMessage({ kind: "info", text: "Vista previa: acá se borraría la promo." });
    start(async () => {
      const res = await remove(form.id);
      if (!res.ok) return setMessage({ kind: "error", text: res.error ?? "No se pudo borrar." });
      setSaved(form);
      router.replace("/admin/promociones");
    });
  };

  const card = (field: string) => `adm-card${errorField === field ? " has-error" : ""}`;

  return (
    <form className="adm-page adm-editor" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <header className="adm-head">
        <div>
          <Link href="/admin/promociones" className="adm-back">← Promociones</Link>
          <h1>{form.id ? saved.title || "Promo" : "Nueva promo"}</h1>
          <p className="adm-sub"><span className={`adm-pill adm-pill-promo-${status}`}>{promoStatusLabels[status]}</span>{dateRange(form)}</p>
        </div>
        <div className="adm-inline-actions">
          {dirty && <span className="adm-dirty">Cambios sin guardar</span>}
          <button type="submit" className="adm-btn adm-btn-primary" disabled={pending || (!dirty && Boolean(form.id))}>{pending ? "Guardando…" : form.id ? "Guardar cambios" : "Crear promo"}</button>
        </div>
      </header>

      {message && <p className={`adm-banner ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}

      <div className="adm-editor-grid adm-promo-grid">
        <div className="adm-editor-main">
          <section className={card("title")} aria-labelledby="t-contenido">
            <h2 id="t-contenido">Contenido</h2>
            <label className="adm-field">
              <span>Título</span>
              <input className="adm-input adm-input-lg" value={form.title} maxLength={80} onChange={(e) => set("title", e.target.value)} placeholder="Ej. 20% OFF en cascos" />
            </label>
            <label className="adm-field">
              <span>Texto <em className="adm-optional">opcional · para el banner y la tarjeta</em></span>
              <textarea className="adm-input" rows={2} value={form.text} maxLength={220} onChange={(e) => set("text", e.target.value)} placeholder="Una línea que cuente el beneficio y hasta cuándo." />
            </label>
            <div className="adm-price-grid">
              <label className="adm-field">
                <span>Sello <em className="adm-optional">opcional</em></span>
                <input className="adm-input" value={form.tag} maxLength={20} onChange={(e) => set("tag", e.target.value)} placeholder="Oferta, Combo, Hot Sale…" />
              </label>
              <label className="adm-field">
                <span>Texto del botón</span>
                <input className="adm-input" value={form.cta} maxLength={30} onChange={(e) => set("cta", e.target.value)} placeholder="Ver promo" />
              </label>
            </div>
            <label className={`adm-field${errorField === "href" ? " has-error" : ""}`}>
              <span>A dónde lleva</span>
              <input className="adm-input" list="promo-links" value={form.href} maxLength={300} onChange={(e) => set("href", e.target.value.trim())} placeholder="/ofertas, /categoria/accesorios o https://…" />
              <datalist id="promo-links">{[...linkSuggestions, ...targets.products.map((p) => `/producto/${p.slug}`)].map((l) => <option key={l} value={l} />)}</datalist>
            </label>
          </section>

          <section className={card("image")} aria-labelledby="t-foto">
            <h2 id="t-foto">Foto <small>opcional, para el banner del inicio</small></h2>
            <ImagesField
              images={form.image ? [form.image] : []}
              onChange={(imgs) => set("image", imgs[0] ?? "")}
              upload={save ? upload : async (file) => URL.createObjectURL(file)}
              max={1}
              hint="Se usa en el banner del inicio, a la derecha del texto. Ideal: apaisada, con el producto o una foto del local. Sin foto, se muestra un cartel con el sello."
            />
          </section>

          <section className={card("placements")} aria-labelledby="t-lugares">
            <h2 id="t-lugares">Dónde se muestra</h2>
            <div className="adm-option-list">
              {placementInfo.map((p) => (
                <label key={p.id} className="adm-option">
                  <input type="checkbox" checked={form.placements.includes(p.id)} onChange={() => toggleIn("placements", p.id)} />
                  <span><strong>{p.label}</strong><small>{p.hint}</small></span>
                </label>
              ))}
            </div>
          </section>

          <section className={card("targets")} aria-labelledby="t-aplica">
            <h2 id="t-aplica">A qué aplica <small>opcional</small></h2>
            <p className="adm-hint" style={{ marginTop: -6, marginBottom: 12 }}>
              Sin elegir nada es una promo general (se muestra en todos lados). Si elegís categorías o productos, en los listados y fichas
              aparece solo donde corresponde.
            </p>
            <div className="adm-chips" role="group" aria-label="Categorías">
              {targets.categories.map((c) => (
                <button key={c.slug} type="button" className={`adm-chip-btn${form.categories.includes(c.slug) ? " is-on" : ""}`} aria-pressed={form.categories.includes(c.slug)} onClick={() => toggleIn("categories", c.slug)}>
                  {c.name}
                </button>
              ))}
            </div>
            <label className="adm-search" style={{ marginTop: 16 }}>
              <span className="sr-only">Buscar productos</span>
              <input type="search" placeholder="Buscar productos para sumar…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            </label>
            {products.length > 0 && (
              <div className="adm-option-list adm-option-compact">
                {products.map((p) => (
                  <label key={p.slug} className="adm-option">
                    <input type="checkbox" checked={form.products.includes(p.slug)} onChange={() => toggleIn("products", p.slug)} />
                    <span>{p.name}{!p.active && <small> (oculto)</small>}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="adm-editor-side">
          <section className={card("dates")} aria-labelledby="t-cuando">
            <h2 id="t-cuando">Cuándo</h2>
            <div className="adm-price-grid">
              <label className="adm-field">
                <span>Desde</span>
                <input type="date" className="adm-input" value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
              </label>
              <label className="adm-field">
                <span>Hasta</span>
                <input type="date" className="adm-input" value={form.endsOn} min={form.startsOn || undefined} onChange={(e) => set("endsOn", e.target.value)} />
              </label>
            </div>
            <p className="adm-hint">Vacío: sin límite. Los últimos 3 días se muestra una cuenta regresiva.</p>
            <label className="adm-field" style={{ marginTop: 14 }}>
              <span>Prioridad</span>
              <select className="adm-input" value={form.priority} onChange={(e) => set("priority", Number(e.target.value))}>
                <option value={3}>Alta: aparece primero</option>
                <option value={2}>Media</option>
                <option value={1}>Normal</option>
                <option value={0}>Baja</option>
              </select>
            </label>
            <label className="adm-toggle" style={{ marginTop: 8 }}>
              <span className="adm-switch">
                <input type="checkbox" role="switch" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                <span aria-hidden />
              </span>
              <span><strong>{form.active ? "Activa" : "Pausada"}</strong><small>Pausala para sacarla sin borrarla.</small></span>
            </label>
          </section>

          <section className="adm-card" aria-labelledby="t-preview">
            <h2 id="t-preview">Así se ve</h2>
            <div className="adm-tabs adm-tabs-full" role="group" aria-label="Lugar">
              {(["inicio", "barra", "listado", "producto"] as const).map((k) => (
                <button key={k} type="button" aria-pressed={preview === k} onClick={() => setPreview(k)}>{previewTabs[k]}</button>
              ))}
            </div>
            <div className="adm-preview" aria-hidden="true" inert>
              {preview === "inicio" && <div className="adm-preview-scale"><PromoSlide p={previewData} /></div>}
              {preview === "barra" && (
                <div className="topbar"><div className="container"><span className="topbar-msg"><a><strong>{previewData.title}</strong><span className="topbar-cta">{form.cta || "Ver más"} →</span></a></span></div></div>
              )}
              {preview === "listado" && <div className="adm-preview-card"><PromoCard promo={previewData} /></div>}
              {preview === "producto" && (
                <div className="adm-preview-badge">
                  <span className="badge badge-accent">15% OFF</span>
                  <span className="badge badge-promo">{form.tag || "Promo"}</span>
                </div>
              )}
            </div>
            {!form.placements.includes(preview) && <p className="adm-hint">Ojo: este lugar no está elegido en «Dónde se muestra».</p>}
          </section>

          {form.id && (
            <section className="adm-card">
              {confirmDelete ? (
                <div className="adm-confirm">
                  <p>¿Borrar «{saved.title}»? Si solo querés sacarla un tiempo, pausala.</p>
                  <div className="adm-inline-actions">
                    <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" disabled={pending} onClick={doDelete}>Sí, borrar</button>
                    <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="adm-btn adm-btn-block adm-btn-danger-ghost" onClick={() => setConfirmDelete(true)}>Borrar promo</button>
              )}
            </section>
          )}
        </aside>
      </div>

      {dirty && (
        <div className="adm-savebar" role="region" aria-label="Cambios sin guardar">
          <span>Tenés cambios sin guardar</span>
          <div className="adm-inline-actions">
            <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setForm(saved)}>Descartar</button>
            <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>
      )}
    </form>
  );
}

