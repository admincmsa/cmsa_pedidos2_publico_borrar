import { useCallback, useEffect, useState } from "react"
import api from "../../services/api"
import { ESTADOS, type EstadoVisible } from "../../utils/estadosPedido"
import { useRefrescoAutomatico } from "../../utils/useRefrescoAutomatico"

/**
 * Cuántos pedidos hay en cada estado visible, en una franja delgada arriba de
 * la lista. Reemplaza al Dashboard: es lo único de él que se usaba.
 */

interface Resumen {
  conteo?: Record<string, number>
  conteo_visible?: Record<EstadoVisible, number>
  remisionados_incompletos?: number
}

const ORDEN: EstadoVisible[] = ["creado", "separado", "cumplido"]

const PUNTO: Record<EstadoVisible, string> = {
  creado: "bg-cmsa-amarillo",
  separado: "bg-cmsa-azul",
  cumplido: "bg-green-500",
}

export default function BarraEstados() {
  const [resumen, setResumen] = useState<Resumen | null>(null)

  const cargar = useCallback(async () => {
    try {
      const res = await api.get("/dashboard_resumen")
      setResumen(res.data)
    } catch {
      // La franja es informativa: si falla, se queda con lo último que tenía.
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])
  useRefrescoAutomatico(cargar)

  if (!resumen) return null

  const c = resumen.conteo ?? {}
  const conteo: Record<EstadoVisible, number> = resumen.conteo_visible ?? {
    creado: (c.ingresado ?? 0) + (c.en_separacion ?? 0),
    separado: (c.separado ?? 0) + (c.comprometido ?? 0),
    cumplido: c.remisionado ?? 0,
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-cmsa-borde bg-white px-6 py-1.5 text-sm text-cmsa-gris">
      {ORDEN.map((estado) => (
        <span key={estado} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${PUNTO[estado]}`} />
          {ESTADOS[estado].texto}
          <b className="text-cmsa-tinta">{conteo[estado] ?? 0}</b>
        </span>
      ))}
      {(resumen.remisionados_incompletos ?? 0) > 0 && (
        <span className="text-xs">
          ({resumen.remisionados_incompletos} cumplidos con menos de lo pedido)
        </span>
      )}
    </div>
  )
}
