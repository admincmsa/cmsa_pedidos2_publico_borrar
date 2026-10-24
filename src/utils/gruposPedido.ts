/**
 * Grupos de estado del día para los botones de BarraEstados: Por separar,
 * Pendientes y Cumplidos, y si un pedido cuenta en una fecha.
 */

export type Grupo = "por_separar" | "pendientes" | "cumplidos"

export interface PedidoConFechas {
  estado: string
  fecha_ingreso?: string | null
  fecha_remisionado?: string | null
}

const GRUPO_DE_ESTADO: Record<string, Grupo> = {
  ingresado: "por_separar",
  en_separacion: "por_separar",
  separado: "pendientes",
  comprometido: "pendientes",
  remisionado: "cumplidos",
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
  return GRUPO_DE_ESTADO[p.estado] ?? null
}

/** ¿El pedido cuenta en su grupo el día `fecha`? */
export function cuentaEl(p: PedidoConFechas, fecha: string): boolean {
  const grupo = grupoDe(p)
  if (grupo === "cumplidos") return diaDe(p.fecha_remisionado) === fecha
  if (!grupo) return false
  const ingreso = diaDe(p.fecha_ingreso)
  return ingreso === null || ingreso <= fecha
}
