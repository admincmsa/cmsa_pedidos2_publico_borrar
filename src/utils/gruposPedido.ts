import { ESTADO_VISIBLE, type EstadoVisible } from "./estadosPedido"

/**
 * Los tres estados del pedido para los botones de BarraEstados (los mismos de
 * los chips: Creado, Separado, Cumplido) y si un pedido cuenta en una fecha.
 */

export type Grupo = EstadoVisible

export interface PedidoConFechas {
  estado: string
  fecha_ingreso?: string | null
  fecha_remisionado?: string | null
}

/** AAAA-MM-DD de hoy en la hora de la tablet. */
export function hoyLocal(): string {
  return diaLocal(new Date())
}

function diaLocal(d: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

// El backend guarda las fechas en UTC sin zona: se leen como UTC y se pasan a la hora local.
function diaDe(iso: string | null | undefined): string | null {
  if (!iso) return null
  const conZona = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`
  const d = new Date(conZona)
  return Number.isNaN(d.getTime()) ? null : diaLocal(d)
}

export function grupoDe(p: PedidoConFechas): Grupo | null {
  return ESTADO_VISIBLE[p.estado] ?? null
}

/**
 * ¿El pedido cuenta el día `fecha`? Creado y Separado: los abiertos que
 * entraron hasta ese día (lo de ayer sin terminar sigue contando). Cumplido:
 * los remisionados ese día.
 */
export function cuentaEl(p: PedidoConFechas, fecha: string): boolean {
  const grupo = grupoDe(p)
  if (grupo === "cumplido") return diaDe(p.fecha_remisionado) === fecha
  if (!grupo) return false
  const ingreso = diaDe(p.fecha_ingreso)
  return ingreso === null || ingreso <= fecha
}
