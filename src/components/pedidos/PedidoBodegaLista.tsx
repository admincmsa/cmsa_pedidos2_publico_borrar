import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { RefreshCw, User } from "lucide-react"
import { kg } from "../../bodega/carrete"
import { CMSA, ESTADO } from "../../theme/cmsa"

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
 */

const AZUL = CMSA.azul
const CONDENSADA = "'Barlow Condensed', 'Arial Narrow', sans-serif"

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
  resumen_cobre?: ResumenCobre
}

type Filtro = "todos" | "curso" | "nuevos"

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "curso", label: "En separación" },
  { id: "nuevos", label: "Sin iniciar" },
]

function estadoDe(p: PedidoResumen): "Listo para terminar" | "En separación" | "Sin iniciar" {
  const r = p.resumen_cobre
  if (r && r.lineas > 0 && r.listas === r.lineas) return "Listo para terminar"
  if (p.estado === "en_separacion" || (r?.kg_separados ?? 0) > 0) return "En separación"
  return "Sin iniciar"
}

const COLOR = {
  "Listo para terminar": { chip: "bg-emerald-100 text-emerald-800", barra: ESTADO.ok },
  "En separación": { chip: "bg-cmsa-amarillo text-cmsa-tinta", barra: AZUL },
  "Sin iniciar": { chip: "bg-cmsa-niebla text-cmsa-gris", barra: AZUL },
} as const

export default function PedidoBodegaLista() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [ingresados, enSeparacion] = await Promise.all([
        api.get("/pedidos_listar", { params: { estado: "ingresado" } }),
        api.get("/pedidos_listar", { params: { estado: "en_separacion" } }),
      ])
      setPedidos([...enSeparacion.data, ...ingresados.data])
    } catch {
      setError("No se pudieron cargar los pedidos. Revise la conexión y vuelva a intentar.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const visibles = useMemo(
    () =>
      pedidos.filter((p) => {
        if (filtro === "todos") return true
        const separado = p.resumen_cobre?.kg_separados ?? 0
        return filtro === "curso" ? separado > 0 : separado === 0
      }),
    [pedidos, filtro],
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
          <div className="text-3xl font-bold leading-none" style={{ fontFamily: CONDENSADA }}>
            Pedidos por separar
          </div>
          <div className="text-[15px] opacity-90">Solo alambre esmaltado de cobre</div>
        </div>

        <div className="flex gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className="h-11 rounded-xl px-4 text-base font-semibold"
              style={
                filtro === f.id
                  ? { background: "#FFFFFF", color: AZUL }
                  : { background: "rgba(255,255,255,0.14)", color: "#FFFFFF" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={cargar}
          disabled={cargando}
          aria-label="Actualizar la lista"
          className="flex h-11 items-center gap-2 rounded-xl px-4 text-base font-semibold"
          style={{ background: "rgba(255,255,255,0.14)" }}
        >
          <RefreshCw size={20} className={cargando ? "animate-spin" : ""} />
          Actualizar
        </button>

        <div className="flex items-center gap-2 text-base">
          <User size={22} />
          {usuario}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {error && (
          <div className="mb-4 rounded-xl px-4 py-3.5 text-lg" style={{ background: ESTADO.errorFondo, color: ESTADO.errorTexto }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 content-start gap-4 lg:grid-cols-2">
          {visibles.map((p) => {
            const r = p.resumen_cobre
            const estado = estadoDe(p)
            const color = COLOR[estado]
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
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[34px] font-bold leading-none" style={{ fontFamily: CONDENSADA }}>
                    {p.f430_consec_docto}
                  </span>
                  <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[15px] font-bold ${color.chip}`}>
                    {estado}
                  </span>
                </div>

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
                        <div className="h-full" style={{ width: `${pct}%`, background: color.barra }} />
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

        {!cargando && visibles.length === 0 && (
          <p className="py-16 text-center text-xl text-cmsa-gris">
            {pedidos.length === 0 ? "No hay pedidos pendientes de separar." : "Ningún pedido en este filtro."}
          </p>
        )}
      </div>
    </div>
  )
}
