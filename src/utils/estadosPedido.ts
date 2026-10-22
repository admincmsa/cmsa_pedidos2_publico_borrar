// ==========================================================
// ESTADOS VISIBLES DEL PEDIDO
//
// La base guarda el estado interno de la app (pedidos.estado); aquí se
// traduce a los cuatro estados que ve el usuario:
//
//   ingresado / en_separacion -> Aprobado - Por separar   (Siesa 2)
//   separado                  -> Aprobado - Separado      (Siesa 2)
//   comprometido              -> Comprometido             (Siesa 3)
//   remisionado               -> Cumplido                 (Siesa 4)
// ==========================================================

export type EstadoVisible = "por_separar" | "separado" | "comprometido" | "cumplido"

export const ESTADO_VISIBLE: Record<string, EstadoVisible> = {
  ingresado: "por_separar",
  en_separacion: "por_separar",
  separado: "separado",
  comprometido: "comprometido",
  remisionado: "cumplido",
}

export const ESTADOS: Record<EstadoVisible, { texto: string; color: string }> = {
  por_separar: { texto: "Aprobado - Por separar", color: "bg-yellow-100 text-yellow-800" },
  separado: { texto: "Aprobado - Separado", color: "bg-blue-100 text-blue-700" },
  comprometido: { texto: "Comprometido", color: "bg-purple-100 text-purple-700" },
  cumplido: { texto: "Cumplido", color: "bg-green-100 text-green-700" },
}

// Estado de Siesa esperado para cada estado visible
const SIESA_ESPERADO: Record<EstadoVisible, number> = {
  por_separar: 2,
  separado: 2,
  comprometido: 3,
  cumplido: 4,
}

const NOMBRE_SIESA: Record<number, string> = {
  0: "En elaboración", 1: "Retenido", 2: "Aprobado", 3: "Comprometido", 4: "Cumplido", 9: "Anulado",
}

export function estadoPedido(estadoInterno: string) {
  const visible = ESTADO_VISIBLE[estadoInterno]
  return visible
    ? { clave: visible, ...ESTADOS[visible] }
    : { clave: null, texto: estadoInterno, color: "bg-gray-100 text-gray-700" }
}

// Aviso solo cuando Siesa dice otra cosa (p. ej. el pedido quedó Retenido o Anulado allá)
export function alertaSiesa(estadoInterno: string, estadoSiesa: number | null | undefined): string | null {
  const visible = ESTADO_VISIBLE[estadoInterno]
  if (!visible || estadoSiesa === null || estadoSiesa === undefined) return null
  if (estadoSiesa === SIESA_ESPERADO[visible]) return null
  return `En Siesa: ${NOMBRE_SIESA[estadoSiesa] ?? estadoSiesa}`
}
