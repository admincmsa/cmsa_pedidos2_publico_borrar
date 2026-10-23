import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import { PlusCircle, Truck, RefreshCw, Trash2, Eye, AlertTriangle, Lock } from "lucide-react"
import { estadoPedido, alertaSiesa } from "../../utils/estadosPedido"

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  estado: string
  estado_siesa: number | null
  remision: string | null
  total_lineas: number
}

export default function PedidoComercialLista() {

  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargando, setCargando] = useState(false)
  const [remisionando, setRemisionando] = useState<number | null>(null)
  const [comprometiendo, setComprometiendo] = useState<number | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargarPedidos = async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await api.get("/pedidos_listar")
      setPedidos(res.data)
    } catch (err) {
      console.error(err)
      setError("No se pudieron cargar los pedidos.")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  // Comercial vuelve a comprometer con lo separado. Si en Siesa no hay compromiso,
  // la app compromete los carretes exactos; si comercial ya comprometió al crear el
  // pedido, la app verifica que coincida con lo separado (si no, dice qué ajustar
  // en Siesa escritorio: por API no se puede bajar un compromiso).
  const handleComprometer = async (id: number) => {
    if (!confirm("¿Comprometer en Siesa lo separado en bodega? Si el pedido ya está comprometido en Siesa, se verifica que coincida con lo separado.")) return

    setComprometiendo(id)
    try {
      const res = await api.post(`/pedido_comprometer/${id}`)
      alert(res.data?.mensaje || "Pedido comprometido con lo separado")
      await cargarPedidos()
    } catch (err) {
      alert(mensajeError(err, "Error al comprometer el pedido"))
    } finally {
      setComprometiendo(null)
    }
  }

  const handleRemisionar = async (id: number) => {
    if (!confirm("¿Confirmas crear la remisión de este pedido en SIESA? El pedido quedará Cumplido.")) return

    setRemisionando(id)
    try {
      const res = await api.post(`/pedido_remisionar/${id}`)
      alert(res.data?.mensaje || "Pedido remisionado en Siesa")
      await cargarPedidos()
    } catch (err) {
      alert(mensajeError(err, "Error al remisionar el pedido"))
    } finally {
      setRemisionando(null)
    }
  }

  const handleEliminar = async (id: number, consecutivo: number) => {
    if (!confirm(`¿Eliminar el pedido ${consecutivo}? Esta acción no se puede deshacer desde la app.`)) return

    setEliminando(id)
    try {
      await api.put(`/pedido_eliminar/${id}`)
      await cargarPedidos()
    } catch (err) {
      alert(mensajeError(err, "Error al eliminar el pedido"))
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="p-4 xl:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base xl:text-xl font-semibold text-gray-800">Pedidos</h1>
        <div className="flex gap-2">
          <button
            onClick={cargarPedidos}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs xl:text-sm"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => navigate("/comercial/nuevo")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs xl:text-sm"
          >
            <PlusCircle size={14} /> Nuevo Pedido
          </button>
        </div>
      </div>

      {error && <p className="text-xs xl:text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-xs xl:text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-1.5">Pedido</th>
              <th className="text-left px-3 py-1.5">Fecha</th>
              <th className="text-left px-3 py-1.5">Cliente</th>
              <th className="text-left px-3 py-1.5">Líneas</th>
              <th className="text-left px-3 py-1.5">Estado</th>
              <th className="text-left px-3 py-1.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const estado = estadoPedido(p.estado)
              const alerta = alertaSiesa(p.estado, p.estado_siesa)
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{p.f430_consec_docto}</td>
                  <td className="px-3 py-1.5">{p.f430_id_fecha || "—"}</td>
                  <td className="px-3 py-1.5">{p.f200_razon_social_pedido_fact}</td>
                  <td className="px-3 py-1.5">{p.total_lineas}</td>
                  <td className="px-3 py-1.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${estado.color}`}>
                      {estado.texto}
                    </span>
                    {estado.clave === "cumplido" && p.remision && (
                      <div className="text-xs text-gray-500 font-mono mt-1">{p.remision}</div>
                    )}
                    {alerta && (
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                        <AlertTriangle size={12} /> {alerta}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      {(
                        <button
                          onClick={() => navigate(`/comercial/detalle/${p.id}`)}
                          title="Ver detalle del pedido"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {p.estado !== "remisionado" && p.estado !== "comprometido" && (
                        <button
                          title="Eliminar pedido"
                          onClick={() => handleEliminar(p.id, p.f430_consec_docto)}
                          disabled={eliminando === p.id}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {p.estado === "separado" && (
                        <button
                          onClick={() => handleComprometer(p.id)}
                          disabled={comprometiendo === p.id}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cmsa-azul text-white text-xs hover:bg-cmsa-azul-profundo disabled:opacity-50"
                        >
                          <Lock size={14} />
                          {comprometiendo === p.id ? "Comprometiendo..." : "Comprometer"}
                        </button>
                      )}

                      {p.estado === "comprometido" && (
                        <button
                          onClick={() => handleRemisionar(p.id)}
                          disabled={remisionando === p.id}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          <Truck size={14} />
                          {remisionando === p.id ? "Remisionando..." : "Remisionar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!cargando && pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No hay pedidos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}