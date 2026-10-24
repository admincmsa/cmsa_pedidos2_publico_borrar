import { CalendarDays, PackageCheck, Truck, Warehouse, type LucideIcon } from "lucide-react"
import { cuentaEl, grupoDe, hoyLocal, type Grupo, type PedidoConFechas } from "../../utils/gruposPedido"
import { ESTADOS } from "../../utils/estadosPedido"

/**
 * Los tres botones de estado, como las tarjetas del Dashboard pero pequeños
 * para la tablet de 10": Creado, Separado y Cumplido, los mismos nombres y
 * colores de los chips. Con un filtro de fecha: lo que cuenta es hoy.
 *
 * - Creado y Separado: los pedidos abiertos que entraron hasta ese día (lo de
 *   ayer sin terminar sigue contando).
 * - Cumplido: los remisionados ese día.
 *
 * Con `onSeleccionar` cada tarjeta es un botón que filtra la lista; sin él
 * solo muestra el conteo.
 */

const TARJETAS: { grupo: Grupo; icono: LucideIcon; color: string }[] = [
  { grupo: "creado", icono: Warehouse, color: "bg-cmsa-amarillo text-cmsa-tinta" },
  { grupo: "separado", icono: PackageCheck, color: "bg-cmsa-azul text-white" },
  { grupo: "cumplido", icono: Truck, color: "bg-[#DDF3E6] text-[#0B5E34]" },
]

export default function BarraEstados({
  pedidos,
  fecha,
  onFecha,
  seleccionado = null,
  onSeleccionar,
}: {
  pedidos: PedidoConFechas[]
  fecha: string
  onFecha: (fecha: string) => void
  seleccionado?: Grupo | null
  onSeleccionar?: (grupo: Grupo | null) => void
}) {
  const conteo: Record<Grupo, number> = { creado: 0, separado: 0, cumplido: 0 }
  for (const p of pedidos) {
    const grupo = grupoDe(p)
    if (grupo && cuentaEl(p, fecha)) conteo[grupo] += 1
  }
  const esHoy = fecha === hoyLocal()

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-cmsa-borde bg-white px-6 py-2">
      {TARJETAS.map(({ grupo, icono: Icono, color }) => {
        const activo = seleccionado === grupo
        const contenido = (
          <>
            <span className={`flex h-7 w-7 items-center justify-center rounded-md ${color}`}>
              <Icono size={16} />
            </span>
            <span className="display text-[22px] leading-none text-cmsa-tinta">{conteo[grupo]}</span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-cmsa-gris">{ESTADOS[grupo].texto}</span>
          </>
        )
        const clase = `flex h-11 items-center gap-2 rounded-lg border bg-white px-3 ${
          activo ? "border-cmsa-azul ring-2 ring-cmsa-azul/30" : "border-cmsa-borde"
        }`
        return onSeleccionar ? (
          <button
            key={grupo}
            onClick={() => onSeleccionar(activo ? null : grupo)}
            aria-pressed={activo}
            className={`${clase} hover:border-cmsa-azul`}
          >
            {contenido}
          </button>
        ) : (
          <div key={grupo} className={clase}>
            {contenido}
          </div>
        )
      })}

      <label className="ml-auto flex h-11 items-center gap-2 rounded-lg border border-cmsa-borde bg-white px-3 text-[14px] text-cmsa-gris">
        <CalendarDays size={16} />
        <input
          type="date"
          value={fecha}
          max={hoyLocal()}
          onChange={(e) => onFecha(e.target.value || hoyLocal())}
          className="bg-transparent text-cmsa-tinta outline-none"
          aria-label="Día que se cuenta"
        />
      </label>
      {!esHoy && (
        <button
          onClick={() => onFecha(hoyLocal())}
          className="h-11 rounded-lg border border-cmsa-borde px-3 text-[14px] font-semibold text-cmsa-azul hover:border-cmsa-azul"
        >
          Hoy
        </button>
      )}
    </div>
  )
}
