// Tablas orientativas por altura del ciclista. Cada marca tiene su geometría:
// validar con los modelos que trabaja el local (Zion, SPY, Eurobike, Gravity).

export type SizeRow = { size: string; frame: string; from: number; to: number };

export const mtbSizes: SizeRow[] = [
  { size: "XS", frame: '13" – 14"', from: 150, to: 160 },
  { size: "S", frame: '15" – 16"', from: 160, to: 170 },
  { size: "M", frame: '17" – 18"', from: 170, to: 180 },
  { size: "L", frame: '19" – 20"', from: 180, to: 190 },
  { size: "XL", frame: '21" – 22"', from: 190, to: 200 },
];

export const roadSizes: SizeRow[] = [
  { size: "XS", frame: "47 – 49 cm", from: 150, to: 160 },
  { size: "S", frame: "50 – 52 cm", from: 160, to: 170 },
  { size: "M", frame: "53 – 55 cm", from: 170, to: 180 },
  { size: "L", frame: "56 – 58 cm", from: 180, to: 190 },
  { size: "XL", frame: "59 – 61 cm", from: 190, to: 200 },
];

// Infantiles: se elige por rodado
export const kidsSizes: SizeRow[] = [
  { size: "R12", frame: "2 a 4 años", from: 85, to: 105 },
  { size: "R16", frame: "4 a 6 años", from: 105, to: 120 },
  { size: "R20", frame: "6 a 9 años", from: 120, to: 135 },
  { size: "R24", frame: "9 a 12 años", from: 135, to: 150 },
];

export const sizeTables = [
  { id: "mtb", name: "Mountain Bike", unit: "Cuadro (pulgadas)", rows: mtbSizes },
  { id: "ruta", name: "Ruta y Gravel", unit: "Cuadro (cm)", rows: roadSizes },
  { id: "infantil", name: "Infantiles", unit: "Edad aproximada", rows: kidsSizes },
] as const;

export type TableId = (typeof sizeTables)[number]["id"];

/** Fila que corresponde a una altura en cm. En el límite entre dos talles, devuelve el más chico. */
export function rowFor(rows: readonly SizeRow[], height: number) {
  return rows.find((r) => height >= r.from && height <= r.to) ?? null;
}
