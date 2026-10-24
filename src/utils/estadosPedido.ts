// ==========================================================
// ESTADOS VISIBLES DEL PEDIDO
//
// La base guarda el estado interno de la app (pedidos.estado); aquí se
// traduce a los tres estados que ve el usuario. Flujo: comercial crea y
// compromete el pedido en Siesa; la app lo trae sola; bodega separa y al pulsar
// «Terminar» se compromete en Siesa lo separado; la remisión se hace en Siesa y
// la importación deja el pedido Cumplido. En la app no hay botones de
// Comprometer ni de Remisionar.
//
//   ingresado / en_separacion -> Creado     (Siesa 3: comprometido por comercial)
//   separado                  -> Separado   solo en simulación (SIESA_ENVIAR=0)
//   comprometido              -> Separado   comprometido en Siesa con lo separado
//   remisionado               -> Cumplido   (Siesa 4, remisionado en Siesa)
// ==========================================================

import type { TonoChip } from "../components/ui/Chip"

export type EstadoVisible = "creado" | "separado" | "cumplido"

export const ESTADO_VISIBLE: Record<string, EstadoVisible> = {
  ingresado: "creado",
  en_separacion: "creado",
  separado: "separado",
  comprometido: "separado",
  remisionado: "cumplido",
}

/** Texto y tono del chip (sistema de diseño): Creado amarillo, Separado azul, Cumplido verde. */
export const ESTADOS: Record<EstadoVisible, { texto: string; tono: TonoChip }> = {
  creado: { texto: "Creado", tono: "amarillo" },
  separado: { texto: "Separado", tono: "azul" },
  cumplido: { texto: "Cumplido", tono: "ok" },
}

// Estados de Siesa esperados para cada estado visible (comercial compromete al crear)
const SIESA_ESPERADO: Record<EstadoVisible, number[]> = {
  creado: [2, 3],
  separado: [2, 3],
  cumplido: [4],
}

const NOMBRE_SIESA: Record<number, string> = {
  0: "En elaboración", 1: "Retenido", 2: "Aprobado", 3: "Comprometido", 4: "Cumplido", 9: "Anulado",
}

export function estadoPedido(estadoInterno: string): { clave: EstadoVisible | null; texto: string; tono: TonoChip } {
  const visible = ESTADO_VISIBLE[estadoInterno]
  return visible
    ? { clave: visible, ...ESTADOS[visible] }
    : { clave: null, texto: estadoInterno, tono: "niebla" }
}

// Aviso solo cuando Siesa dice otra cosa (p. ej. el pedido quedó Retenido o Anulado allá)
export function alertaSiesa(estadoInterno: string, estadoSiesa: number | null | undefined): string | null {
  const visible = ESTADO_VISIBLE[estadoInterno]
  if (!visible || estadoSiesa === null || estadoSiesa === undefined) return null
  if (SIESA_ESPERADO[visible].includes(estadoSiesa)) return null
  return `En Siesa: ${NOMBRE_SIESA[estadoSiesa] ?? estadoSiesa}`
}
