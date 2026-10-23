// ==========================================================
// ESTADOS VISIBLES DEL PEDIDO
//
// La base guarda el estado interno de la app (pedidos.estado); aquí se
// traduce a los tres estados que ve el usuario. Flujo: comercial crea el pedido
// y lo compromete en Siesa por lo pedido; bodega separa; comercial vuelve a
// comprometer con lo separado (botón Comprometer) y remisiona.
//
//   ingresado / en_separacion -> Creado     (Siesa 2, o 3 si comercial ya comprometió)
//   separado                  -> Separado   bodega terminó; falta comprometer lo separado
//   comprometido              -> Separado   comprometido con lo separado; listo para remisionar
//   remisionado               -> Cumplido   (Siesa 4)
// ==========================================================

export type EstadoVisible = "creado" | "separado" | "cumplido"

export const ESTADO_VISIBLE: Record<string, EstadoVisible> = {
  ingresado: "creado",
  en_separacion: "creado",
  separado: "separado",
  comprometido: "separado",
  remisionado: "cumplido",
}

export const ESTADOS: Record<EstadoVisible, { texto: string; color: string }> = {
  creado: { texto: "Creado", color: "bg-cmsa-amarillo text-cmsa-tinta" },
  separado: { texto: "Separado", color: "bg-cmsa-azul text-white" },
  cumplido: { texto: "Cumplido", color: "bg-green-100 text-green-700" },
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
  if (SIESA_ESPERADO[visible].includes(estadoSiesa)) return null
  return `En Siesa: ${NOMBRE_SIESA[estadoSiesa] ?? estadoSiesa}`
}
