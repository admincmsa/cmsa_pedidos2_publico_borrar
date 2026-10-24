import { useCallback, useEffect, useState, type MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import { PlusCircle, Truck, Trash2, AlertTriangle, Lock } from "lucide-react"
import { estadoPedido, alertaSiesa } from "../../utils/estadosPedido"
import { useRefrescoAutomatico } from "../../utils/useRefrescoAutomatico"
import { kg } from "../../bodega/carrete"
import BarraEstados from "./BarraEstados"
import Chip from "../ui/Chip"
import Boton from "../ui/Boton"
import Aviso, { type TipoAviso } from "../ui/Aviso"
import Dialogo from "../ui/Dialogo"

/**
 * Pedidos para comercial: una tabla del sistema de diseño (encabezado azul,
 * zebra) con lo que comercial decide desde aquí: comprometer lo separado y
 * remisionar. Las confirmaciones y los resultados se muestran en la propia
 * pantalla, no con `confirm()` ni `alert()`, que la tablet no muestra bien.
 */

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  estado: string
  estado_siesa: number | null
  remision: string | null
  total_lineas: number
  resumen_cobre?: { calibres: number[]; kg_pedidos: number; kg_separados: number; lineas: number; listas: number }
}

type Accion = { tipo: "comprometer" | "remisionar" | "eliminar"; pedido: PedidoResumen }

const TEXTO_ACCION: Record<Accion["tipo"], { titulo: (p: PedidoResumen) => string; detalle: string; boton: string; peligro?: boolean }> = {
  comprometer: {
    titulo: (p) => `¿Comprometer en Siesa lo separado del pedido ${p.f430_consec_docto}?`,
    detalle: "La app deja en Siesa los carretes exactos que separó bodega. Si el pedido ya estaba comprometido por lo pedido, el compromiso se cambia por lo separado.",
    boton: "Comprometer",
  },
  remisionar: {
    titulo: (p) => `¿Crear la remisión del pedido ${p.f430_consec_docto} en Siesa?`,
    detalle: "Sale lo comprometido. El pedido queda Cumplido y ya no se puede cambiar desde la app.",
    boton: "Remisionar",
  },
  eliminar: {
    titulo: (p) => `¿Eliminar el pedido ${p.f430_consec_docto} de la app?`,
    detalle: "Desaparece de las listas de comercial y de bodega. En Siesa no cambia nada.",
    boton: "Eliminar",
    peligro: true,
  },
}

// Los botones de la fila no abren el pedido: la fila entera sí.
const soloBoton = (accion: () => void) => (e: MouseEvent) => {
  e.stopPropagation()
  accion()
}

export default function PedidoComercialLista() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargando, setCargando] = useState(false)
  const [accion, setAccion] = useState<Accion | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [aviso, setAviso] = useState<{ tipo: TipoAviso; titulo: string; detalle?: string } | null>(null)

  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    try {
      const res = await api.get("/pedidos_listar")
      setPedidos(res.data)
    } catch (err) {
      console.error(err)
      setAviso({ tipo: "error", titulo: "No se pudieron cargar los pedidos", detalle: "Revise la conexión con el servidor." })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])
  useRefrescoAutomatico(cargarPedidos)

  // Comercial vuelve a comprometer con lo separado: la app deja en Siesa los carretes
  // exactos y libera lo que comercial había comprometido de más (el 131512 reemplaza
  // la cantidad de cada lote; 0 lo libera). Remisionar saca lo comprometido.
  const ejecutar = async () => {
    if (!accion) return
    const { tipo, pedido } = accion
    setOcupado(pedido.id)
    setAviso(null)
    try {
      if (tipo === "comprometer") {
        const res = await api.post(`/pedido_comprometer/${pedido.id}`)
        setAviso({ tipo: "ok", titulo: `Pedido ${pedido.f430_consec_docto} comprometido`, detalle: res.data?.mensaje })
      } else if (tipo === "remisionar") {
        const res = await api.post(`/pedido_remisionar/${pedido.id}`)
        setAviso({ tipo: "ok", titulo: `Pedido ${pedido.f430_consec_docto} remisionado`, detalle: res.data?.mensaje })
      } else {
        await api.put(`/pedido_eliminar/${pedido.id}`)
        setAviso({ tipo: "ok", titulo: `Pedido ${pedido.f430_consec_docto} eliminado de la app` })
      }
      setAccion(null)
      await cargarPedidos(true)
    } catch (err) {
      setAccion(null)
      setAviso({
        tipo: "error",
        titulo: `No se pudo ${tipo} el pedido ${pedido.f430_consec_docto}`,
        detalle: mensajeError(err, "Intente otra vez; si vuelve a fallar, avise a sistemas."),
      })
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <BarraEstados />

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-[32px] text-cmsa-azul">Pedidos</h1>
            <p className="mt-1 text-[15px] text-cmsa-gris">
              Comercial compromete lo separado por bodega y remisiona.
            </p>
          </div>
          <Boton onClick={() => navigate("/comercial/nuevo")}>
            <PlusCircle size={18} /> Nuevo pedido
          </Boton>
        </div>

        {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}

        <div className="overflow-x-auto rounded-xl border border-cmsa-borde bg-white">
          <table className="tabla-cmsa">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Calibres</th>
                <th className="text-right">Kilos</th>
                <th>Estado</th>
                <th>Acción</th>
                <th className="w-12"><span className="sr-only">Eliminar</span></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const estado = estadoPedido(p.estado)
                const alerta = alertaSiesa(p.estado, p.estado_siesa)
                const r = p.resumen_cobre
                const calibres = r?.calibres ?? []
                const verPedido = () => navigate(`/comercial/detalle/${p.id}`)
                return (
                  <tr key={p.id} onClick={verPedido} title="Ver el pedido" className="cursor-pointer hover:[&>td]:bg-cmsa-azul/5">
                    <td className="whitespace-nowrap">
                      <div className="display text-[20px] text-cmsa-tinta">{p.f430_consec_docto}</div>
                      <div className="mt-0.5 text-[13px] text-cmsa-gris">{p.f430_id_fecha || "—"}</div>
                    </td>
                    <td>
                      <div className="max-w-[230px] truncate font-semibold" title={p.f200_razon_social_pedido_fact}>
                        {p.f200_razon_social_pedido_fact}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{calibres.length > 0 ? `AWG ${calibres.join(", ")}` : "—"}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {r && r.kg_pedidos > 0 ? (
                        <>
                          <b>{kg(r.kg_separados)}</b>
                          <span className="text-cmsa-gris"> / {kg(r.kg_pedidos)} kg</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Chip tono={estado.tono}>{estado.texto}</Chip>
                      {estado.clave === "cumplido" && p.remision && (
                        <div className="mt-1 text-[13px] text-cmsa-gris">{p.remision}</div>
                      )}
                      {alerta && (
                        <div className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-[#8A1B12]">
                          <AlertTriangle size={13} /> {alerta}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.estado === "separado" && (
                        <Boton
                          onClick={soloBoton(() => setAccion({ tipo: "comprometer", pedido: p }))}
                          disabled={ocupado === p.id}
                          className="h-10 w-36 px-3 text-[14px]"
                        >
                          <Lock size={16} />
                          {ocupado === p.id ? "Comprometiendo…" : "Comprometer"}
                        </Boton>
                      )}
                      {p.estado === "comprometido" && (
                        <Boton
                          variante="ok"
                          onClick={soloBoton(() => setAccion({ tipo: "remisionar", pedido: p }))}
                          disabled={ocupado === p.id}
                          className="h-10 w-36 px-3 text-[14px]"
                        >
                          <Truck size={16} />
                          {ocupado === p.id ? "Remisionando…" : "Remisionar"}
                        </Boton>
                      )}
                    </td>
                    <td className="text-center">
                      {p.estado !== "remisionado" && p.estado !== "comprometido" && (
                        <button
                          title="Eliminar pedido"
                          aria-label={`Eliminar el pedido ${p.f430_consec_docto}`}
                          onClick={soloBoton(() => setAccion({ tipo: "eliminar", pedido: p }))}
                          disabled={ocupado === p.id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#8A1B12] hover:bg-[#FDE7E5] disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!cargando && pedidos.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-cmsa-gris">
                    No hay pedidos registrados. Agregue uno con «Nuevo pedido».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accion && (
        <Dialogo
          titulo={TEXTO_ACCION[accion.tipo].titulo(accion.pedido)}
          detalle={TEXTO_ACCION[accion.tipo].detalle}
          confirmar={TEXTO_ACCION[accion.tipo].boton}
          peligro={TEXTO_ACCION[accion.tipo].peligro}
          ocupado={ocupado === accion.pedido.id}
          onConfirmar={ejecutar}
          onCancelar={() => setAccion(null)}
        />
      )}
    </div>
  )
}
