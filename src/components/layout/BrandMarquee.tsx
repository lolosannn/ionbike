import { publicImage } from "@/lib/public-files";

// Para mostrar el logo de una marca, poner el archivo en public/marcas/ con el nombre
// de la marca en minúsculas (zion.svg, spy.png, ...). Si no hay archivo, se muestra el nombre.

// Copias de la lista por mitad, para que la cinta cubra pantallas anchas aunque haya pocas marcas
const copies = 3;

export function BrandMarquee({ brands }: { brands: string[] }) {
  const items = brands.map((name) => ({ name, logo: publicImage("marcas", name.toLowerCase()) }));
  const half = Array.from({ length: copies }, () => items).flat();

  return (
    <div className="marquee">
      <ul className="sr-only">
        {brands.map((b) => <li key={b}>{b}</li>)}
      </ul>
      {/* La cinta se duplica para que el desplazamiento no tenga cortes */}
      <div className="marquee-track" aria-hidden="true">
        {[...half, ...half].map((b, i) => (
          <span key={i} className={`brand-chip${i >= items.length ? " dup" : ""}`}>
            {b.logo ? <img src={b.logo} alt="" /> : b.name}
          </span>
        ))}
      </div>
    </div>
  );
}
