import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import { estadoPedido, alertaSiesa } from "../../utils/estadosPedido"
import { Trash2, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react"

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
  detalle: LineaDetalle[]
}

export default function PedidoComercialDetalle() {

  const { pedidoId } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [eliminandoSerial, setEliminandoSerial] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargarPedido = async () => {
    try {
      const res = await api.get(`/pedido_detalle/${pedidoId}`)
      setPedido(res.data)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar el detalle del pedido.")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPedido()
  }, [pedidoId])

  const handleEliminarSerial = async (serialId: number, serialCodigo: string) => {
    if (!confirm(
        `¿Quitar el rollo ${serialCodigo} de este pedido? ` +
        `Si el pedido ya estaba separado (comprometido), volverá a bodega para que lo ajusten.`
    )) return

    setEliminandoSerial(serialId)
    setError(null)

    try {
        const res = await api.delete(`/pedido_serial_eliminar/${serialId}`)
        console.log("Respuesta pedido_serial_eliminar:", res.data)

        await cargarPedido()

    } catch (err) {
        console.error("Error eliminando serial:", err)
        setError(mensajeError(err, "Error al eliminar el rollo"))
    } finally {
        setEliminandoSerial(null)
    }
    }

  if (cargando) return <div className="p-4 xl:p-6 text-gray-400">Cargando pedido...</div>
  if (!pedido) return <div className="p-4 xl:p-6 text-red-600">{error || "Pedido no encontrado"}</div>

  const estado = estadoPedido(pedido.estado)
  const alerta = alertaSiesa(pedido.estado, pedido.estado_siesa)
  const bloqueado = pedido.estado === "comprometido" || pedido.estado === "remisionado"

  return (
    <div className="p-4 xl:p-6">

      <button
        onClick={() => navigate("/comercial")}
        className="flex items-center gap-1 text-xs xl:text-sm text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={14} /> Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow p-3 xl:p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base xl:text-lg font-semibold text-gray-800">
            Pedido {pedido.f430_consec_docto} — {pedido.f200_razon_social_pedido_fact}
          </h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
            {estado.texto}
          </span>
        </div>
        {pedido.f431_notas && (
          <p className="text-xs xl:text-sm text-gray-500 mt-1">Notas: {pedido.f431_notas}</p>
        )}
        {pedido.remision && (
          <p className="text-xs xl:text-sm text-gray-600 mt-1">
            Remisión <span className="font-mono">{pedido.remision}</span>
          </p>
        )}
        {alerta && (
          <p className="text-xs xl:text-sm text-red-600 mt-1 flex items-center gap-1">
            <AlertTriangle size={14} /> {alerta}
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs xl:text-sm text-red-600 mb-3 flex items-center gap-1">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {/* ================================================== */}
      {/* LÍNEAS DEL PEDIDO CON SUS ROLLOS */}
      {/* ================================================== */}

      <div className="space-y-4">
        {pedido.detalle.map((d) => {
          const progreso = d.f431_cant_pedida_base
            ? Math.min(100, (d.peso_acumulado / d.f431_cant_pedida_base) * 100)
            : 0

          return (
            <div key={d.id} className="bg-white rounded-xl shadow p-3 xl:p-4">

              <div className="flex justify-between items-center mb-2">
                <p className="text-sm xl:text-base font-medium text-gray-800">
                  {d.f120_referencia} — {d.f120_descripcion}
                </p>
                {d.estado_linea === "separado" && (
                  <CheckCircle2 className="text-green-600" size={16} />
                )}
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${
                    d.estado_linea === "separado" ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {d.peso_acumulado.toFixed(2)} kg de {d.f431_cant_pedida_base} kg pedidos
                {" · "}{d.seriales.length} rollo(s)
              </p>

              <table className="w-full text-xs xl:text-sm">
                <thead className="text-gray-500">
                  <tr>
                    <th className="text-left py-1">Serie</th>
                    <th className="text-left py-1">AWG</th>
                    <th className="text-left py-1">Carrete</th>
                    <th className="text-left py-1">Peso (kg)</th>
                    <th className="text-left py-1">Usuario</th>
                    <th className="text-left py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {d.seriales.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-1 font-mono">{s.serial}</td>
                      <td className="py-1">{s.awg}</td>
                      <td className="py-1">{s.tipo_carrete}</td>
                      <td className="py-1">{s.peso_kg.toFixed(2)}</td>
                      <td className="py-1 text-gray-500">{s.usuario}</td>
                      <td className="py-1 text-right">
                        {!bloqueado && (
                        <button
                            type="button"
                            onClick={() => handleEliminarSerial(s.id, s.serial)}
                            disabled={eliminandoSerial === s.id}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Quitar este rollo del pedido"
                            >
                            <Trash2 size={14} />
                            </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {d.seriales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-gray-400">
                        Sin rollos escaneados en esta línea
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}