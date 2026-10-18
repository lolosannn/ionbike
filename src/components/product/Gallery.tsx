"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product/ProductCard";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="pdp-gallery">
      <div className="pdp-main">
        <ProductImage src={images[current] ?? null} alt={alt} />
      </div>
      {images.length > 1 && (
        <div className="pdp-thumbs">
          {images.map((src, i) => (
            <button key={src} type="button" aria-label={`Ver foto ${i + 1}`} aria-pressed={i === current} onClick={() => setCurrent(i)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
