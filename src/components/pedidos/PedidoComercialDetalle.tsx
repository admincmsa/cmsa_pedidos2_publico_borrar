import { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import { estadoPedido, alertaSiesa } from "../../utils/estadosPedido"
import { awgDeItem, kg } from "../../bodega/carrete"
import { Trash2, ChevronLeft, AlertTriangle, FileText } from "lucide-react"
import { CMSA, ESTADO } from "../../theme/cmsa"
import Chip from "../ui/Chip"
import Boton from "../ui/Boton"
import Aviso from "../ui/Aviso"
import Dialogo from "../ui/Dialogo"
import TituloSeccion from "../ui/TituloSeccion"

/**
 * El pedido visto por comercial: cada línea con lo pedido, lo separado y los
 * carretes que escaneó bodega. Desde aquí comercial puede quitar un carrete
 * mientras el pedido no esté comprometido con lo separado.
 */

interface Serial {
  id: number
  serial: string
  peso_kg: number
  awg: number
  tipo_carrete: string
  codigo_proveedor: string
  usuario: string | null
  fecha_escaneo: string | null
}

interface LineaDetalle {
  id: number
  f120_id: string
  f120_referencia: string
  f120_descripcion: string
  f431_cant_pedida_base: number
  estado_linea: string
  peso_acumulado: number
  seriales: Serial[]
}

interface PedidoDetalle {
  id: number
  f430_consec_docto: number
  f200_razon_social_pedido_fact: string
  f431_notas: string
  estado: string
  estado_siesa: number | null
  remision: string | null
  direccion_envio?: string | null
  ciudad_envio?: string | null
  depto_envio?: string | null
  detalle: LineaDetalle[]
}

export default function PedidoComercialDetalle() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [porQuitar, setPorQuitar] = useState<Serial | null>(null)
  const [quitando, setQuitando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarPedido = useCallback(async () => {
    try {
      const res = await api.get(`/pedido_detalle/${pedidoId}`)
      setPedido(res.data)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar el detalle del pedido.")
    } finally {
      setCargando(false)
    }
  }, [pedidoId])

  useEffect(() => {
    cargarPedido()
  }, [cargarPedido])

  const quitar = async () => {
    if (!porQuitar) return
    setQuitando(true)
    setError(null)
    try {
      await api.delete(`/pedido_serial_eliminar/${porQuitar.id}`)
      setPorQuitar(null)
      await cargarPedido()
    } catch (err) {
      setPorQuitar(null)
      setError(mensajeError(err, "No se pudo quitar el carrete."))
    } finally {
      setQuitando(false)
    }
  }

  if (cargando) return <div className="p-6 text-lg text-cmsa-gris">Cargando pedido…</div>
  if (!pedido) return <div className="p-6"><Aviso tipo="error" titulo={error || "Pedido no encontrado"} /></div>

  const estado = estadoPedido(pedido.estado)
  const alerta = alertaSiesa(pedido.estado, pedido.estado_siesa)
  const bloqueado = pedido.estado === "comprometido" || pedido.estado === "remisionado"
  const destino = [pedido.direccion_envio, [pedido.ciudad_envio, pedido.depto_envio].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Boton variante="secundario" onClick={() => navigate("/comercial")} className="h-11 px-4">
          <ChevronLeft size={18} /> Pedidos
        </Boton>
        {/* El pedido completo como en papel (formato de Siesa/CRM), con todas las familias */}
        <Boton variante="secundario" onClick={() => navigate(`/comercial/detalle/${pedido.id}/impreso`)} className="ml-auto h-11 px-4">
          <FileText size={18} /> Ver pedido impreso
        </Boton>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-cmsa-borde bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="display text-[32px] text-cmsa-azul">Pedido {pedido.f430_consec_docto}</h1>
            <div className="mt-1.5 text-lg font-semibold">{pedido.f200_razon_social_pedido_fact}</div>
            {destino && (
              <div className="text-[15px] text-cmsa-gris">
                <b>Despachar a:</b> {destino}
              </div>
            )}
            {pedido.f431_notas && <div className="text-[15px] text-cmsa-gris"><b>Notas:</b> {pedido.f431_notas}</div>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Chip tono={estado.tono}>{estado.texto}</Chip>
            {pedido.remision && <Chip tono="profundo">Remisión {pedido.remision}</Chip>}
          </div>
        </div>
        {alerta && (
          <div className="flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: ESTADO.errorTexto }}>
            <AlertTriangle size={16} /> {alerta}
          </div>
        )}
      </div>

      {error && <Aviso tipo="error" titulo={error} onCerrar={() => setError(null)} />}

      {pedido.detalle.map((d) => {
        const awg = awgDeItem(d.f120_id)
        const pedida = Number(d.f431_cant_pedida_base || 0)
        const separado = Number(d.peso_acumulado || 0)
        const pct = pedida > 0 ? Math.min(100, (separado / pedida) * 100) : 0
        const completa = d.estado_linea === "separado"

        return (
          <div key={d.id} className="flex flex-col gap-3 rounded-xl border border-cmsa-borde bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="display text-[26px] text-cmsa-tinta">
                  {awg !== null ? `AWG ${awg}` : d.f120_referencia}
                </span>
                <span className="text-[15px] text-cmsa-gris">
                  Ítem {d.f120_id} · {d.f120_descripcion}
                </span>
              </div>
              {awg === null ? (
                <Chip tono="niebla">No se separa con la pistola</Chip>
              ) : completa ? (
                <Chip tono="ok">Separado</Chip>
              ) : (
                <Chip tono="amarillo">Por separar</Chip>
              )}
            </div>

            {awg !== null && (
              <>
                <div className="h-3 overflow-hidden rounded-full bg-cmsa-borde">
                  <div className="h-full" style={{ width: `${pct}%`, background: completa ? ESTADO.ok : CMSA.azul }} />
                </div>
                <div className="text-[15px]">
                  <b className="text-lg tabular-nums">{kg(separado)}</b> de {kg(pedida)} kg pedidos · {d.seriales.length}{" "}
                  {d.seriales.length === 1 ? "carrete" : "carretes"}
                </div>

                {d.seriales.length > 0 ? (
                  <table className="tabla-cmsa">
                    <thead>
                      <tr>
                        <th>Carrete</th>
                        <th>AWG</th>
                        <th>Tipo</th>
                        <th className="text-right">Peso</th>
                        <th>Escaneó</th>
                        {!bloqueado && <th className="w-14"><span className="sr-only">Quitar</span></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {d.seriales.map((s) => (
                        <tr key={s.id}>
                          <td className="font-semibold tabular-nums">{s.serial}</td>
                          <td>{s.awg}</td>
                          <td className="text-cmsa-gris">{s.tipo_carrete}</td>
                          <td className="text-right font-semibold tabular-nums">{kg(s.peso_kg)} kg</td>
                          <td className="text-cmsa-gris">{s.usuario || "—"}</td>
                          {!bloqueado && (
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => setPorQuitar(s)}
                                aria-label={`Quitar el carrete ${s.serial}`}
                                title="Quitar este carrete del pedido"
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#8A1B12] hover:bg-[#FDE7E5]"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[15px] text-cmsa-gris">Bodega todavía no ha escaneado carretes en esta línea.</p>
                )}
              </>
            )}

            {awg === null && (
              <div className="text-[15px] text-cmsa-gris">
                Cantidad pedida: <b className="tabular-nums">{numeroCorto(pedida)}</b>. Se despacha por fuera de la app.
              </div>
            )}
          </div>
        )
      })}

      <TituloSeccion linea className="mt-2 opacity-70">Fin del pedido</TituloSeccion>

      {porQuitar && (
        <Dialogo
          titulo={`¿Quitar el carrete ${porQuitar.serial} del pedido?`}
          detalle={`Se devuelven ${kg(porQuitar.peso_kg)} kg a la línea y el carrete vuelve a quedar disponible. Si el pedido ya estaba separado, vuelve a bodega.`}
          confirmar="Quitar"
          peligro
          ocupado={quitando}
          onConfirmar={quitar}
          onCancelar={() => setPorQuitar(null)}
        />
      )}
    </div>
  )
}

function numeroCorto(n: number): string {
  return n.toLocaleString("es-CO", { maximumFractionDigits: 2 })
}
