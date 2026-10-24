import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api from "../../services/api"
import { User } from "lucide-react"
import { kg } from "../../bodega/carrete"
import { CMSA, DISPLAY, ESTADO } from "../../theme/cmsa"
import { useRefrescoAutomatico } from "../../utils/useRefrescoAutomatico"
import BarraEstados from "./BarraEstados"
import { cuentaEl, grupoDe, hoyLocal } from "../../utils/gruposPedido"

/**
 * Pedidos por separar, para la tablet de bodega.
 *
 * Cada tarjeta dice lo que el operario necesita antes de caminar a la estantería:
 * a dónde se despacha, qué calibres lleva, cuántos kilos van de cuántos y
 * cuántos calibres quedan listos.
 *
 * Los kilos y el avance los entrega el backend en `resumen_cobre`. Si el
 * servidor todavía no los manda (versión anterior), la tarjeta sigue sirviendo:
 * muestra el pedido sin la barra.
 *
 * Todos los pedidos de esta lista están en estado Creado (por separar): la
 * tarjeta no lleva etiqueta de estado; el avance lo dicen la barra y los
 * kilos. Arriba van los tres botones de estado del día (BarraEstados). La
 * lista se refresca sola (useRefrescoAutomatico), sin botón «Actualizar».
 */

const AZUL = CMSA.azul

interface ResumenCobre {
  kg_pedidos: number
  kg_separados: number
  lineas: number
  listas: number
  calibres: number[]
}

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f200_razon_social_pedido_fact: string
  estado: string
  total_lineas: number
  direccion_envio: string | null
  ciudad_envio: string | null
  depto_envio: string | null
  fecha_ingreso?: string | null
  fecha_remisionado?: string | null
  resumen_cobre?: ResumenCobre
}

// La barra se pone verde cuando a ningún calibre le cabe otro carrete.
function barraDe(p: PedidoResumen): string {
  const r = p.resumen_cobre
  return r && r.lineas > 0 && r.listas === r.lineas ? ESTADO.ok : AZUL
}

export default function PedidoBodegaLista() {
  const navigate = useNavigate()
  // Lo que dejó la pantalla de separación al terminar (pedido comprometido).
  const avisoSeparacion = (useLocation().state as { aviso?: string } | null)?.aviso
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fecha, setFecha] = useState(hoyLocal)

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    setError(null)
    try {
      // Todos: los botones de estado cuentan también pendientes y cumplidos.
      const res = await api.get("/pedidos_listar")
      setPedidos(res.data)
    } catch {
      setError("No se pudieron cargar los pedidos. Revise la conexión y vuelva a intentar.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])
  useRefrescoAutomatico(cargar)

  // Los que están en separación primero, después los que nadie ha empezado.
  const porSeparar = useMemo(
    () =>
      pedidos
        .filter((p) => grupoDe(p) === "creado" && cuentaEl(p, fecha))
        .sort((a, b) => Number(b.estado === "en_separacion") - Number(a.estado === "en_separacion")),
    [pedidos, fecha],
  )

  const usuario = (() => {
    try {
      const guardado = localStorage.getItem("usuario")
      return guardado ? (JSON.parse(guardado).nombre as string) : "Bodega"
    } catch {
      return "Bodega"
    }
  })()

  return (
    <div className="flex h-screen flex-col bg-cmsa-niebla text-cmsa-tinta">
      <header className="flex h-[72px] flex-shrink-0 items-center gap-5 px-6 text-white" style={{ background: AZUL }}>
        <div className="flex-1">
          <div className="text-3xl font-bold leading-none" style={DISPLAY}>
            Pedidos por separar
          </div>
          <div className="text-[15px] opacity-90">Solo alambre esmaltado de cobre</div>
        </div>

        <div className="flex items-center gap-2 text-base">
          <User size={22} />
          {usuario}
        </div>
      </header>

      <BarraEstados pedidos={pedidos} fecha={fecha} onFecha={setFecha} />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {avisoSeparacion && (
          <div className="mb-4 rounded-xl px-4 py-3.5 text-lg font-semibold" style={{ background: ESTADO.okFondo, color: ESTADO.okTexto }}>
            {avisoSeparacion}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3.5 text-lg" style={{ background: ESTADO.errorFondo, color: ESTADO.errorTexto }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 content-start gap-4 lg:grid-cols-2">
          {porSeparar.map((p) => {
            const r = p.resumen_cobre
            const pct = r && r.kg_pedidos > 0 ? Math.min(100, (r.kg_separados / r.kg_pedidos) * 100) : 0
            const destino = [p.direccion_envio, [p.ciudad_envio, p.depto_envio].filter(Boolean).join(", ")]
              .filter(Boolean)
              .join(" · ")

            return (
              <button
                key={p.id}
                onClick={() => navigate(`/bodega/${p.id}`)}
                className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 text-left shadow-sm"
              >
                <span className="text-[34px] font-bold leading-none" style={DISPLAY}>
                  {p.f430_consec_docto}
                </span>

                <div className="truncate text-lg font-semibold">{p.f200_razon_social_pedido_fact}</div>

                {destino && (
                  <div className="truncate text-[15px] text-cmsa-gris">
                    <b>Despachar a:</b> {destino}
                  </div>
                )}

                {r && r.calibres.length > 0 && (
                  <div className="text-[15px] text-cmsa-gris">AWG {r.calibres.join(", ")}</div>
                )}

                {r ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-cmsa-borde">
                        <div className="h-full" style={{ width: `${pct}%`, background: barraDe(p) }} />
                      </div>
                      <span className="whitespace-nowrap text-lg font-bold">
                        {kg(r.kg_separados)} / {kg(r.kg_pedidos)} kg
                      </span>
                    </div>
                    <div className="text-[15px] text-cmsa-gris">
                      {r.listas} de {r.lineas} {r.lineas === 1 ? "calibre listo" : "calibres listos"}
                    </div>
                  </>
                ) : (
                  <div className="text-[15px] text-cmsa-gris">
                    {p.total_lineas} línea(s) · abra el pedido para ver el avance
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {!cargando && porSeparar.length === 0 && (
          <p className="py-16 text-center text-xl text-cmsa-gris">No hay pedidos pendientes de separar.</p>
        )}
      </div>
    </div>
  )
}
