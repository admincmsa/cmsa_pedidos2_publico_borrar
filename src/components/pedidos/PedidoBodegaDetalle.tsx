import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import { Trash2, CheckCircle2, ArrowLeft, ScanLine, PackageCheck, AlertTriangle, PackagePlus } from "lucide-react"


interface Serial {
  id: number
  serial: string
  peso_kg: number
  awg: number
  tipo_carrete: string
  codigo_proveedor: string
  usuario: string | null
  fecha_escaneo: string | null
  pendiente_packing?: boolean
}

// Respuesta del backend cuando el carrete leído no existe en el inventario
interface CarreteNuevo {
  codigo: string            // lectura original, para reenviarla al confirmar
  puedeAgregar: boolean
  serial: string
  peso_kg: number
  codigo_proveedor: string
  awg: number
  item_siesa: number
  tipo_carrete: string
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
  direccion_envio: string | null
  ciudad_envio: string | null
  depto_envio: string | null
  estado: string
  detalle: LineaDetalle[]
}

export default function PedidoBodegaDetalle() {

  const { pedidoId } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [lineaActiva, setLineaActiva] = useState<number | null>(null)

  const [codigoInput, setCodigoInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [carreteNuevo, setCarreteNuevo] = useState<CarreteNuevo | null>(null)
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

  // Envía la lectura. Con agregarAInventario=true, el backend crea el carrete
  // en el inventario (pendiente de packing list) antes de agregarlo al pedido.
  const enviarLectura = async (codigo: string, agregarAInventario = false) => {
    if (!lineaActiva) return

    setGuardandoSerial(true)
    setError(null)
    setAviso(null)

    try {
      const res = await api.post("/pedido_serial_agregar", {
        pedido_detalle_id: lineaActiva,
        codigo_escaneado: codigo,
        agregar_a_inventario: agregarAInventario,
      })

      setCodigoInput("")
      setCarreteNuevo(null)
      if (res.data?.alta_manual) setAviso(res.data.mensaje)
      await cargarPedido()

    } catch (err: any) {
      const data = err?.response?.data
      if (err?.response?.status === 404 && data?.codigo === "ROLLO_NO_EXISTE") {
        // El carrete no está en el inventario: se pregunta si se agrega
        setCodigoInput("")
        setCarreteNuevo({ codigo, puedeAgregar: !!data.puede_agregar, ...data.carrete })
      } else {
        setCarreteNuevo(null)
        setError(mensajeError(err, "Error al registrar el carrete"))
      }
    } finally {
      setGuardandoSerial(false)
      inputEscaneoRef.current?.focus()
    }
  }

  const handleAgregarSerial = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!codigoInput.trim()) {
      setError("Escanee el código del carrete.")
      return
    }

    await enviarLectura(codigoInput)
  }

  const cancelarCarreteNuevo = () => {
    setCarreteNuevo(null)
    inputEscaneoRef.current?.focus()
  }

  const handleEliminarSerial = async (serialId: number) => {
    if (!confirm("¿Eliminar esta lectura?")) return
    try {
      await api.delete(`/pedido_serial_eliminar/${serialId}`)
      await cargarPedido()
    } catch (err: any) {
      setError(mensajeError(err, "Error al eliminar la lectura"))
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
      setError(mensajeError(err, "Error al finalizar la separación"))
    } finally {
      setFinalizando(false)
    }
  }

  if (!pedido) return <div className="p-4 xl:p-6 text-gray-400">Cargando pedido...</div>

  const linea = pedido.detalle.find((d) => d.id === lineaActiva)


  return (
    <div className="p-4 xl:p-6">
      

      <button
        onClick={() => navigate("/bodega")}
        className="flex items-center gap-1 text-xs xl:text-sm text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={14} /> Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow p-3 xl:p-4 mb-4">
        <h1 className="text-base xl:text-lg font-semibold text-gray-800">
          Pedido {pedido.f430_consec_docto} — {pedido.f200_razon_social_pedido_fact}
        </h1>
        {(pedido.ciudad_envio || pedido.direccion_envio) && (
          <p className="text-xs xl:text-sm text-gray-700 mt-1">
            <span className="font-semibold">Despachar a:</span>{" "}
            {pedido.direccion_envio || "—"}
            {pedido.ciudad_envio && (
              <> · {pedido.ciudad_envio}
                {pedido.depto_envio && pedido.depto_envio !== pedido.ciudad_envio && `, ${pedido.depto_envio}`}
              </>
            )}
          </p>
        )}
        {pedido.f431_notas && (
          <p className="text-xs xl:text-sm text-gray-500 mt-1">Notas: {pedido.f431_notas}</p>
        )}
      </div>

      {/* ================================================== */}
      {/* LÍNEAS DEL PEDIDO */}
      {/* ================================================== */}

      <div className="grid gap-3 mb-4">
        {pedido.detalle.map((d) => {
          const progreso = d.f431_cant_pedida_base
            ? Math.min(100, (d.peso_acumulado / d.f431_cant_pedida_base) * 100)
            : 0

          return (
            <button
              key={d.id}
              onClick={() => { setLineaActiva(d.id); setCarreteNuevo(null); setError(null); setAviso(null) }}
              className={`text-left bg-white rounded-xl shadow p-4 border-2 transition ${
                lineaActiva === d.id ? "border-blue-500" : "border-transparent"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
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

              <p className="text-xs text-gray-500">
                {d.peso_acumulado.toFixed(2)} kg de {d.f431_cant_pedida_base} kg pedidos
                {" · "}{d.seriales.length} carrete(s) leídos
              </p>
            </button>
          )
        })}
      </div>

      {/* ================================================== */}
      {/* PANEL DE ESCANEO DE LA LÍNEA ACTIVA */}
      {/* ================================================== */}

      {linea && (
        <div className="bg-white rounded-xl shadow p-3 xl:p-4">
          <h2 className="text-sm xl:text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <ScanLine size={16} /> Escanear carretes — {linea.f120_referencia}
          </h2>

          <form onSubmit={handleAgregarSerial} className="flex gap-2 mb-1">
            <input
              ref={inputEscaneoRef}
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              placeholder="Escanee el código del carrete..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={guardandoSerial}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs xl:text-sm"
            >
              Agregar
            </button>
          </form>

          <p className="text-xs text-gray-400 mb-3">
            La serie, el peso y el calibre se extraen del QR del carrete (Q&lt;peso&gt; # S&lt;serie&gt; # L&lt;código&gt;).
          </p>

          {/* CARRETE QUE NO ESTÁ EN EL INVENTARIO */}
          {carreteNuevo && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs xl:text-sm">
              <p className="font-semibold text-amber-800 flex items-center gap-1 mb-2">
                <AlertTriangle size={14} />
                El carrete {carreteNuevo.serial} no existe en el inventario
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-gray-700 mb-2">
                <p><span className="text-gray-500">Peso:</span> {Number(carreteNuevo.peso_kg).toFixed(2)} kg</p>
                <p><span className="text-gray-500">Calibre:</span> AWG {carreteNuevo.awg}</p>
                <p><span className="text-gray-500">Ítem Siesa:</span> {carreteNuevo.item_siesa}</p>
                <p><span className="text-gray-500">Código proveedor:</span> <span className="font-mono">{carreteNuevo.codigo_proveedor}</span></p>
                <p><span className="text-gray-500">Carrete:</span> {carreteNuevo.tipo_carrete}</p>
              </div>
              {carreteNuevo.puedeAgregar ? (
                <>
                  <p className="text-gray-600 mb-2">
                    ¿Desea agregarlo al inventario y a este pedido? Quedará <b>pendiente de packing list</b>:
                    los datos del proveedor se completarán cuando se cargue el packing que lo trae.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => enviarLectura(carreteNuevo.codigo, true)}
                      disabled={guardandoSerial}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      <PackagePlus size={14} />
                      {guardandoSerial ? "Agregando..." : "Agregar al inventario"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarCarreteNuevo}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">
                  Agregar carretes desde bodega está deshabilitado. Verifique que su packing list esté cargado
                  o comuníquese con el administrador.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-xs xl:text-sm text-red-600 mb-3 whitespace-pre-line">{error}</p>}
          {aviso && <p className="text-xs xl:text-sm text-amber-700 mb-3">{aviso}</p>}

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
              {linea.seriales.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1 font-mono">
                    {s.serial}
                    {s.pendiente_packing && (
                      <span
                        title="Agregado desde bodega: pendiente de packing list"
                        className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-sans bg-amber-100 text-amber-800"
                      >
                        Pendiente packing
                      </span>
                    )}
                  </td>
                  <td className="py-1">{s.awg}</td>
                  <td className="py-1">{s.tipo_carrete}</td>
                  <td className="py-1">{s.peso_kg.toFixed(2)}</td>
                  <td className="py-1 text-gray-500">{s.usuario}</td>
                  <td className="py-1 text-right">
                    <button onClick={() => handleEliminarSerial(s.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 size={14} />
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm xl:text-base font-medium"
        >
          <PackageCheck size={16} />
          {finalizando ? "Finalizando..." : "Finalizar separación de pedido"}
        </button>
      </div>
      
    </div>
  )
}