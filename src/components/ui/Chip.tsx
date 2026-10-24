/**
 * Chip del sistema de diseño: versales espaciadas, esquinas rectas.
 * «COTIZACIÓN # 2026-01» en amarillo; la fecha en azul profundo. Aquí sirve
 * para los estados del pedido y de cada calibre.
 */

export type TonoChip = "amarillo" | "azul" | "profundo" | "niebla" | "ok" | "alerta" | "error"

const TONO: Record<TonoChip, string> = {
  amarillo: "bg-cmsa-amarillo text-cmsa-tinta",
  azul: "bg-cmsa-azul text-white",
  profundo: "bg-cmsa-azul-profundo text-white",
  niebla: "bg-cmsa-niebla text-cmsa-gris",
  ok: "bg-[#DDF3E6] text-[#0B5E34]",
  alerta: "bg-[#FBF3B8] text-[#5C4A00]",
  error: "bg-[#FDE7E5] text-[#8A1B12]",
}

export default function Chip({
  tono,
  children,
  grande = false,
  className = "",
}: {
  tono: TonoChip
  children: React.ReactNode
  /** En la tablet de bodega: 14 px y más aire. */
  grande?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap font-bold uppercase tracking-[0.12em] ${
        grande ? "px-3.5 py-2 text-[14px]" : "px-3 py-1.5 text-[12px]"
      } ${TONO[tono]} ${className}`}
    >
      {children}
    </span>
  )
}
