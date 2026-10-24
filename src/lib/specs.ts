// Especificaciones de la ficha de producto. Cada producto guarda specs como
// [{ label, value }]; acá se ordenan por importancia y se agrupan por parte de la bici.

export type Spec = { label: string; value: string };

/** Partes de la bici, de la más buscada a la menos. `aliases`: otros nombres que puede traer el label. */
export const bikeParts = [
  { key: "cuadro", label: "Cuadro", aliases: ["cuadro", "frame", "material del cuadro"] },
  { key: "horquilla", label: "Horquilla", aliases: ["horquilla", "suspension", "suspensión", "fork"] },
  { key: "frenos", label: "Frenos", aliases: ["frenos", "freno"] },
  { key: "cambios", label: "Cambios", aliases: ["cambios", "cambio", "descarrilador trasero", "desviador trasero"] },
  { key: "shifter", label: "Shifter", aliases: ["shifter", "shifters", "mandos", "comandos"] },
  { key: "ruedas", label: "Ruedas", aliases: ["ruedas", "llantas", "rodado"] },
  { key: "cubiertas", label: "Cubiertas", aliases: ["cubiertas", "cubierta", "neumaticos", "neumáticos"] },
  { key: "peso", label: "Peso", aliases: ["peso"] },
  { key: "plato", label: "Plato y palanca", aliases: ["plato palanca", "plato y palanca", "palanca", "platos", "bielas", "transmision", "transmisión"] },
  { key: "pinon", label: "Piñón", aliases: ["piñon", "piñón", "pinon", "cassette", "velocidades"] },
  { key: "descarrilador", label: "Descarrilador", aliases: ["descarrilador", "descarrilador delantero", "desviador delantero"] },
  { key: "cadena", label: "Cadena", aliases: ["cadena"] },
  { key: "caja", label: "Caja pedalera", aliases: ["caja pedalera", "eje pedalero"] },
  { key: "manillar", label: "Manillar", aliases: ["manillar", "manubrio", "stem", "potencia"] },
  { key: "portasilla", label: "Portasilla", aliases: ["portasilla", "tija", "caño de asiento"] },
  { key: "asiento", label: "Asiento", aliases: ["asiento", "montura", "sillin", "sillín"] },
] as const;

export type BikePartKey = (typeof bikeParts)[number]["key"] | "otros";

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Agrupa las specs por parte, en el orden de bikeParts. Si una parte tiene varias specs
 * (por ejemplo "Rodado" y "Ruedas"), se muestran juntas. Lo que no reconoce va a "Otros".
 */
export function groupSpecs(specs: Spec[]) {
  const groups = new Map<BikePartKey, Spec[]>();
  for (const spec of specs) {
    const part = bikeParts.find((p) => (p.aliases as readonly string[]).includes(normalize(spec.label)));
    const key: BikePartKey = part?.key ?? "otros";
    groups.set(key, [...(groups.get(key) ?? []), spec]);
  }
  const ordered = bikeParts
    .filter((p) => groups.has(p.key))
    .map((p) => ({ key: p.key as BikePartKey, label: p.label as string, specs: groups.get(p.key)! }));
  if (groups.has("otros")) ordered.push({ key: "otros", label: "Otros datos", specs: groups.get("otros")! });
  return ordered;
}
