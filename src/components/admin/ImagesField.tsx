"use client";

import { useRef, useState } from "react";

type Upload = { key: string; name: string; error?: string };

const accept = "image/jpeg,image/png,image/webp,image/avif";

/** Fotos del producto: subir (botón o arrastrando), ordenar, elegir portada y quitar */
export function ImagesField({
  images,
  onChange,
  upload,
  max,
  hint,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  upload: (file: File) => Promise<string>;
  max: number;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Las subidas terminan de a una: se acumulan sobre la lista más reciente
  const latest = useRef(images);
  latest.current = images;

  const addFiles = async (files: File[]) => {
    const room = max - latest.current.length;
    const batch = files.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(room, 0));
    if (files.length > batch.length) {
      const key = `aviso-${Date.now()}`;
      setUploads((u) => [...u, { key, name: "", error: room <= 0 ? `Ya hay ${max} fotos (el máximo).` : "Algunos archivos no son fotos o superan el máximo de fotos." }]);
    }
    for (const file of batch) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      setUploads((u) => [...u, { key, name: file.name }]);
      try {
        const url = await upload(file);
        onChange([...latest.current, url]);
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch (e) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: e instanceof Error ? e.message : "No se pudo subir." } : x)));
      }
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div
      className={`adm-images${dragOver ? " is-dragover" : ""}`}
      onDragOver={(e) => {
        if (dragIndex === null && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(true); }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (dragIndex !== null || !e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragOver(false);
        addFiles([...e.dataTransfer.files]);
      }}
    >
      <ul className="adm-image-grid">
        {images.map((src, i) => (
          <li
            key={src}
            className={`adm-image${dragIndex === i ? " is-dragging" : ""}`}
            draggable
            onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
            onDrop={(e) => { if (dragIndex === null) return; e.preventDefault(); move(dragIndex, i); setDragIndex(null); }}
          >
            <img src={src} alt={`Foto ${i + 1}`} />
            {i === 0 && max > 1 && <span className="adm-image-cover">Portada</span>}
            <div className="adm-image-actions">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Mover la foto ${i + 1} a la izquierda`}>←</button>
              {i > 0 && <button type="button" onClick={() => move(i, 0)} aria-label={`Usar la foto ${i + 1} de portada`} title="Usar de portada">★</button>}
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label={`Mover la foto ${i + 1} a la derecha`}>→</button>
              <button type="button" className="danger" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`Quitar la foto ${i + 1}`}>✕</button>
            </div>
          </li>
        ))}
        {uploads.filter((u) => !u.error).map((u) => (
          <li key={u.key} className="adm-image is-uploading" aria-live="polite">
            <span className="adm-spinner" aria-hidden />
            <small>Subiendo {u.name}…</small>
          </li>
        ))}
        {images.length < max && (
          <li>
            <button type="button" className="adm-image-add" onClick={() => input.current?.click()}>
              <span aria-hidden>+</span>
              Subir fotos
              <small>o arrastralas acá</small>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          addFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      {uploads.some((u) => u.error) && (
        <ul className="adm-upload-errors" role="alert">
          {uploads.filter((u) => u.error).map((u) => (
            <li key={u.key}>
              {u.name && <b>{u.name}: </b>}{u.error}
              <button type="button" className="adm-link" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>Cerrar</button>
            </li>
          ))}
        </ul>
      )}
      <p className="adm-hint">
        {hint ?? "La primera es la portada. Arrastralas para ordenarlas. Ideal: fondo claro, producto entero y apaisada (4:3)."}{" "}
        JPG, PNG o WebP de hasta 15 MB: se achican y optimizan solas.
      </p>
    </div>
  );
}
