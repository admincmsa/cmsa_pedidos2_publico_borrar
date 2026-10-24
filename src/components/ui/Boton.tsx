import type { ButtonHTMLAttributes } from "react"

/**
 * Botón de la app. `primario` es el azul CMSA; `peligro` solo para quitar o
 * eliminar; `ok` para cerrar un paso (terminar, remisionar). Todos miden al
 * menos 44 px de alto: se tocan con el dedo en la tablet.
 */
type Variante = "primario" | "secundario" | "peligro" | "ok" | "fantasma"

const VARIANTE: Record<Variante, string> = {
  primario: "bg-cmsa-azul text-white hover:bg-cmsa-azul-profundo",
  secundario: "border-2 border-cmsa-borde bg-white text-cmsa-tinta hover:bg-cmsa-niebla",
  peligro: "bg-[#FDE7E5] text-[#8A1B12] hover:bg-[#F9D3CF]",
  ok: "bg-[#0E7A43] text-white hover:bg-[#0B5E34]",
  fantasma: "bg-white/15 text-white hover:bg-white/25",
}

export default function Boton({
  variante = "primario",
  grande = false,
  className = "",
  type = "button",
  children,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        grande ? "h-16 px-8 text-[22px]" : "h-11 px-5 text-base"
      } ${VARIANTE[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  )
}
