import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../services/api"
import { Trash2, CheckCircle2, ArrowLeft, ScanLine, PackageCheck } from "lucide-react"


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
  detalle: LineaDetalle[]
}

// ==========================================================
// PARSEO DEL CÓDIGO ESCANEADO
// Formato: 10 caracteres de código + 5 dígitos de peso
// Los 5 dígitos de peso se interpretan con 2 decimales
// implícitos (ej: "01250" -> 12.50 kg)
// ==========================================================






export default function PedidoBodegaDetalle() {

  const { pedidoId } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [lineaActiva, setLineaActiva] = useState<number | null>(null)

  const [codigoInput, setCodigoInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardandoSerial, setGuardandoSerial] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  const inputEscaneoRef = useRef<HTMLInputElement>(null)

  const cargarPedido = async () => {
    try {
      const res = await api.get(`/pedido_detalle/${pedidoId}`)
      setPedido(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    cargarPedido()
  }, [pedidoId])

  useEffect(() => {
    // Mantiene el foco en el input de escaneo para que la pistola
    // siempre escriba ahí sin que el auxiliar tenga que hacer clic
    if (lineaActiva !== null) {
      inputEscaneoRef.current?.focus()
    }
  }, [lineaActiva])

  const handleAgregarSerial = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lineaActiva) return

    if (!codigoInput.trim()) {
      setError("Escanee el código del carrete.")
      return
    }

    setGuardandoSerial(true)
    setError(null)

    try {
      await api.post("/pedido_serial_agregar", {
        pedido_detalle_id: lineaActiva,
        codigo_escaneado: codigoInput,
      })

      setCodigoInput("")
      await cargarPedido()

    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al registrar el rollo")
    } finally {
      setGuardandoSerial(false)
      inputEscaneoRef.current?.focus()
    }
  }

  const handleEliminarSerial = async (serialId: number) => {
    if (!confirm("¿Eliminar esta lectura?")) return
    try {
      await api.delete(`/pedido_serial_eliminar/${serialId}`)
      await cargarPedido()
    } catch (err) {
      console.error(err)
    }
  }

  const handleFinalizarSeparacion = async () => {
    if (!pedido) return

    const lineasIncompletas = pedido.detalle.filter(
      (d) => d.estado_linea !== "separado"
    ).length

    const mensaje = lineasIncompletas > 0
      ? `Hay ${lineasIncompletas} línea(s) sin completar. ¿Confirmas finalizar la separación de todas formas? El pedido pasará a revisión de comercial con lo que se logró separar.`
      : "¿Confirmas finalizar la separación de este pedido?"

    if (!confirm(mensaje)) return

    setFinalizando(true)
    try {
      await api.put(`/pedido_finalizar_separacion/${pedidoId}`)
      navigate("/bodega")
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al finalizar la separación")
    } finally {
      setFinalizando(false)
    }
  }

  if (!pedido) return <div className="p-6 text-gray-400">Cargando pedido...</div>

  const linea = pedido.detalle.find((d) => d.id === lineaActiva)


  return (
    <div className="p-6">
      

      <button
        onClick={() => navigate("/bodega")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={16} /> Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-lg font-semibold text-gray-800">
          Pedido {pedido.f430_consec_docto} — {pedido.f200_razon_social_pedido_fact}
        </h1>
        {pedido.f431_notas && (
          <p className="text-sm text-gray-500 mt-1">Notas: {pedido.f431_notas}</p>
        )}
      </div>

      {/* ================================================== */}
      {/* LÍNEAS DEL PEDIDO */}
      {/* ================================================== */}

      <div className="grid gap-3 mb-6">
        {pedido.detalle.map((d) => {
          const progreso = d.f431_cant_pedida_base
            ? Math.min(100, (d.peso_acumulado / d.f431_cant_pedida_base) * 100)
            : 0

          return (
            <button
              key={d.id}
              onClick={() => setLineaActiva(d.id)}
              className={`text-left bg-white rounded-xl shadow p-4 border-2 transition ${
                lineaActiva === d.id ? "border-blue-500" : "border-transparent"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-gray-800">
                  {d.f120_referencia} — {d.f120_descripcion}
                </p>
                {d.estado_linea === "separado" && (
                  <CheckCircle2 className="text-green-600" size={18} />
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

              <p className="text-xs text-gray-500">
                {d.peso_acumulado.toFixed(2)} kg de {d.f431_cant_pedida_base} kg pedidos
                {" · "}{d.seriales.length} rollo(s) leídos
              </p>
            </button>
          )
        })}
      </div>

      {/* ================================================== */}
      {/* PANEL DE ESCANEO DE LA LÍNEA ACTIVA */}
      {/* ================================================== */}

      {linea && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ScanLine size={18} /> Escanear rollos — {linea.f120_referencia}
          </h2>

          <form onSubmit={handleAgregarSerial} className="flex gap-2 mb-1">
            <input
              ref={inputEscaneoRef}
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              placeholder="Escanee el código del rollo..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={guardandoSerial}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Agregar
            </button>
          </form>

          <p className="text-xs text-gray-400 mb-3">
            El código y el peso se extraen automáticamente de la lectura (10 caracteres de código + 5 dígitos de peso).
          </p>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <table className="w-full text-sm">
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
              {linea.seriales.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1 font-mono">{s.serial}</td>
                  <td className="py-1">{s.awg}</td>
                  <td className="py-1">{s.tipo_carrete}</td>
                  <td className="py-1">{s.peso_kg.toFixed(2)}</td>
                  <td className="py-1 text-gray-500">{s.usuario}</td>
                  <td className="py-1 text-right">
                    <button onClick={() => handleEliminarSerial(s.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================== */}
      {/* FINALIZAR SEPARACIÓN */}
      {/* ================================================== */}

      <div className="flex justify-end mt-6">
        <button
          onClick={handleFinalizarSeparacion}
          disabled={finalizando}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <PackageCheck size={18} />
          {finalizando ? "Finalizando..." : "Finalizar separación de pedido"}
        </button>
      </div>
      
    </div>
  )
}