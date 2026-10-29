"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { store } from "@/config/store";
import { discountPct, formatPrice, installmentPrice, transferPrice } from "@/lib/pricing";
import { limits, parsePesos, slugify, type CategoryOption, type ProductForm, type SaveResult } from "@/lib/admin/product-form";
import { ImagesField } from "./ImagesField";
import { VariantsField } from "./VariantsField";
import { SpecsField } from "./SpecsField";

type Props = {
  initial: ProductForm;
  categories: CategoryOption[];
  brands: string[];
  // Sin acciones (vista previa): se puede probar todo, pero no se guarda
  save?: (form: ProductForm) => Promise<SaveResult>;
  remove?: (id: string) => Promise<{ ok: boolean; error?: string }>;
};

type Toast = { kind: "ok" | "error" | "info"; text: string };

const pesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const showPesos = (n: number | null) => (n === null ? "" : pesos.format(n));

/** Campo de precio en pesos: se escribe libre y se formatea al salir ("565978" → "565.978") */
function PriceInput({ id, value, onChange, placeholder, invalid }: { id: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string; invalid?: boolean }) {
  const [text, setText] = useState(showPesos(value));
  const last = useRef(value);
  // Si el valor cambia desde afuera (descartar cambios), se refleja
  useEffect(() => {
    if (value !== last.current) setText(showPesos(value));
    last.current = value;
  }, [value]);
  return (
    <span className={`adm-money${invalid ? " is-invalid" : ""}`}>
      <i aria-hidden>$</i>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const n = parsePesos(e.target.value);
          last.current = n;
          onChange(n);
        }}
        onBlur={() => setText(showPesos(parsePesos(text)))}
      />
    </span>
  );
}

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="adm-toggle">
      <span className="adm-switch">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </label>
  );
}

async function uploadToServer(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/admin/api/fotos", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo subir la foto.");
  return data.url;
}

export function ProductEditor({ initial, categories, brands, save, remove }: Props) {
  const router = useRouter();
  const demo = !save;
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  // En un producto nuevo, el link se arma solo con el nombre hasta que lo tocan a mano
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [errorField, setErrorField] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorField === key) setErrorField(null);
  };

  // Aviso al cerrar o recargar con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.kind === "error" ? 9000 : 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const category = categories.find((c) => c.id === form.categoryId);
  const isBike = Boolean(category && [category.slug, category.parentSlug].some((s) => s === "bicicletas" || s === "e-bike"));
  const off = form.price !== null ? discountPct(Math.round(form.price * 100), form.compareAt === null ? null : Math.round(form.compareAt * 100)) : null;
  const priceCents = form.price === null ? null : Math.round(form.price * 100);
  const compareInvalid = form.compareAt !== null && form.price !== null && form.compareAt <= form.price;
  const totalStock = form.variants.reduce((n, v) => n + v.stock, 0);

  const onName = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
    if (errorField === "name") setErrorField(null);
  };

  const fail = (text: string, field?: string) => {
    setErrorField(field ?? null);
    setToast({ kind: "error", text });
    if (field) document.getElementById(`campo-${field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = () => {
    if (!form.name.trim()) return fail("Poné el nombre del producto.", "name");
    if (!form.categoryId) return fail("Elegí la categoría.", "categoryId");
    if (form.price === null || form.price <= 0) return fail("Poné el precio.", "price");
    if (compareInvalid) return fail("El precio anterior tiene que ser mayor que el precio actual (o dejalo vacío).", "compareAt");
    if (form.images.some((i) => i.startsWith("blob:")) && !demo) return fail("Esperá a que terminen de subir las fotos.", "images");
    if (demo) {
      setSaved(form);
      setToast({ kind: "info", text: "Vista previa: así se guardaría. En la tienda real, el cambio se ve al instante en la web." });
      return;
    }
    startSaving(async () => {
      try {
        const res = await save(form);
        if (!res.ok) return fail(res.error, res.field);
        const next = { ...form, id: res.id, updatedAt: res.updatedAt, slug: res.slug };
        setForm(next);
        setSaved(next);
        setSlugTouched(true);
        setToast({ kind: "ok", text: form.id ? "Cambios guardados. Ya se ven en la tienda." : "Producto creado." });
        if (!form.id) router.replace(`/admin/productos/${res.id}`);
        else router.refresh();
      } catch {
        fail("No se pudo guardar. Revisá la conexión y probá de nuevo (si la sesión se cerró, volvé a ingresar).");
      }
    });
  };

  const doDelete = () => {
    if (!form.id) return;
    if (demo || !remove) {
      setToast({ kind: "info", text: "Vista previa: acá se borraría el producto." });
      setConfirmDelete(false);
      return;
    }
    startSaving(async () => {
      const res = await remove(form.id);
      if (!res.ok) {
        setConfirmDelete(false);
        return fail(res.error ?? "No se pudo borrar.");
      }
      setSaved(form);
      router.replace("/admin/productos");
    });
  };

  const fieldClass = (field: string) => `adm-card${errorField === field ? " has-error" : ""}`;

  return (
    <form
      className="adm-page adm-editor"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <header className="adm-head">
        <div>
          <Link
            href="/admin/productos"
            className="adm-back"
            onClick={(e) => { if (dirty && !confirm("Tenés cambios sin guardar. ¿Salir igual?")) e.preventDefault(); }}
          >
            ← Productos
          </Link>
          <h1>{form.id ? saved.name || "Producto" : "Nuevo producto"}</h1>
          <p className="adm-sub">
            <span className={`adm-status ${form.active ? "on" : "off"}`}>{form.active ? "Publicado" : "Oculto"}</span>
            {form.id && saved.active && (
              <Link href={`/producto/${saved.slug}`} target="_blank" rel="noreferrer">Ver en la tienda ↗</Link>
            )}
          </p>
        </div>
        <div className="adm-inline-actions">
          {dirty && <span className="adm-dirty">Cambios sin guardar</span>}
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving || (!dirty && Boolean(form.id))}>
            {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </header>

      <div className="adm-editor-grid">
        <div className="adm-editor-main">
          <section className={fieldClass("name")} id="campo-name" aria-labelledby="t-info">
            <h2 id="t-info">Información</h2>
            <label className="adm-field">
              <span>Nombre</span>
              <input className="adm-input adm-input-lg" value={form.name} maxLength={limits.name} onChange={(e) => onName(e.target.value)} placeholder="Ej. Bicicleta MTB Zion Aspro Rodado 29 21V" required />
            </label>
            <label className={`adm-field${errorField === "slug" ? " has-error" : ""}`} id="campo-slug">
              <span>Link del producto</span>
              <span className="adm-slug">
                <i>/producto/</i>
                <input
                  value={form.slug}
                  maxLength={limits.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  onBlur={() => set("slug", slugify(form.slug) || slugify(form.name))}
                />
              </span>
              {initial.id && form.slug !== initial.slug && (
                <small className="adm-warn-text">Ojo: si cambiás el link, los enlaces que ya se compartieron dejan de andar.</small>
              )}
            </label>
            <label className="adm-field">
              <span>Descripción</span>
              <textarea className="adm-input" rows={6} value={form.description} maxLength={limits.description} onChange={(e) => set("description", e.target.value)} placeholder="Para quién es, en qué terreno rinde, qué la diferencia…" />
              <small className="adm-count">{form.description.length} / {limits.description}</small>
            </label>
          </section>

          <section className={fieldClass("images")} id="campo-images" aria-labelledby="t-fotos">
            <h2 id="t-fotos">Fotos <small>{form.images.length} / {limits.images}</small></h2>
            <ImagesField
              images={form.images}
              onChange={(images) => set("images", images)}
              upload={demo ? async (file) => URL.createObjectURL(file) : uploadToServer}
              max={limits.images}
            />
          </section>

          <section className={fieldClass(errorField === "compareAt" ? "compareAt" : "price")} id="campo-price" aria-labelledby="t-precio">
            <h2 id="t-precio">Precio</h2>
            <div className="adm-price-grid">
              <label className="adm-field" htmlFor="precio">
                <span>Precio de lista (con tarjeta)</span>
                <PriceInput id="precio" value={form.price} onChange={(v) => set("price", v)} placeholder="0" invalid={errorField === "price"} />
              </label>
              <label className="adm-field" htmlFor="precio-anterior" id="campo-compareAt">
                <span>Precio anterior (tachado) <em className="adm-optional">opcional</em></span>
                <PriceInput id="precio-anterior" value={form.compareAt} onChange={(v) => set("compareAt", v)} placeholder="Sin oferta" invalid={compareInvalid} />
                <small className={compareInvalid ? "adm-error-text" : "adm-muted"}>
                  {compareInvalid ? "Tiene que ser mayor que el precio de lista." : "Si lo completás, el producto pasa a Ofertas con su % de descuento."}
                </small>
              </label>
            </div>
            {priceCents !== null && priceCents > 0 && (
              <div className="adm-price-preview" aria-label="Así se ve en la tienda">
                <span className="adm-muted">Así se ve en la tienda</span>
                <div>
                  <strong>{formatPrice(transferPrice(priceCents))}</strong>
                  <span> con transferencia o efectivo ({store.transferDiscountPct}% off)</span>
                </div>
                <div className="adm-muted">
                  {off && form.compareAt !== null && <><s>{formatPrice(Math.round(form.compareAt * 100))}</s> </>}
                  {formatPrice(priceCents)} con tarjeta · {store.installments} cuotas sin interés de {formatPrice(installmentPrice(priceCents))}
                  {off && <em className="adm-chip adm-chip-accent">{off}% OFF</em>}
                </div>
              </div>
            )}
          </section>

          <section className={fieldClass("variants")} id="campo-variants" aria-labelledby="t-variantes">
            <h2 id="t-variantes">Variantes y stock</h2>
            <VariantsField variants={form.variants} onChange={(variants) => set("variants", variants)} slug={form.slug || slugify(form.name)} />
          </section>

          <section className={fieldClass("specs")} id="campo-specs" aria-labelledby="t-specs">
            <h2 id="t-specs">Especificaciones</h2>
            <SpecsField specs={form.specs} onChange={(specs) => set("specs", specs)} isBike={isBike} />
          </section>
        </div>

        <aside className="adm-editor-side">
          <section className="adm-card" aria-labelledby="t-estado">
            <h2 id="t-estado">Estado</h2>
            <Switch checked={form.active} onChange={(v) => set("active", v)} label="Publicado" hint={form.active ? "Se ve en la tienda." : "Oculto: solo se ve en el panel."} />
            <Switch checked={form.featured} onChange={(v) => set("featured", v)} label="Destacado" hint="Aparece primero en «Más vendidos» del inicio." />
            <Switch checked={form.onRequest} onChange={(v) => set("onRequest", v)} label="A pedido" hint="Sin compra online: se consulta por WhatsApp." />
            {form.active && !form.onRequest && totalStock === 0 && (
              <p className="adm-note">Está publicado pero sin stock: se ve como «Sin stock» y no se puede comprar.</p>
            )}
          </section>

          <section className={fieldClass("categoryId")} id="campo-categoryId" aria-labelledby="t-org">
            <h2 id="t-org">Organización</h2>
            <label className="adm-field">
              <span>Categoría</span>
              <select className="adm-input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
                <option value="">Elegí una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.parentName ? `${c.parentName} › ${c.name}` : c.name}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>Marca</span>
              <input className="adm-input" list="adm-brands" value={form.brand} maxLength={limits.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Elegí o escribí una nueva" />
              <datalist id="adm-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
              {form.brand && !brands.some((b) => b.toLowerCase() === form.brand.trim().toLowerCase()) && (
                <small className="adm-muted">Marca nueva: se crea al guardar.</small>
              )}
            </label>
          </section>

          {form.id && (
            <section className="adm-card" aria-labelledby="t-mas">
              <h2 id="t-mas">Más acciones</h2>
              <Link href={`/admin/productos/nuevo?desde=${form.id}`} className="adm-btn adm-btn-block">Duplicar producto</Link>
              {confirmDelete ? (
                <div className="adm-confirm" role="alertdialog" aria-label="Confirmar borrado">
                  <p>¿Borrar «{saved.name}»? No se puede deshacer. Si ya tuvo ventas, mejor ocultalo.</p>
                  <div className="adm-inline-actions">
                    <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={doDelete} disabled={saving}>Sí, borrar</button>
                    <button type="button" className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="adm-btn adm-btn-block adm-btn-danger-ghost" onClick={() => setConfirmDelete(true)}>Borrar producto</button>
              )}
            </section>
          )}
        </aside>
      </div>

      {dirty && (
        <div className="adm-savebar" role="region" aria-label="Cambios sin guardar">
          <span>Tenés cambios sin guardar</span>
          <div className="adm-inline-actions">
            <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => { setForm(saved); setErrorField(null); }}>Descartar</button>
            <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`adm-toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Cerrar aviso">✕</button>
        </div>
      )}
    </form>
  );
}
