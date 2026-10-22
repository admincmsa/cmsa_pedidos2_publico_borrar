import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { PlusCircle, Truck, RefreshCw, Trash2, Lock, Eye } from "lucide-react"

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  estado: string
  total_lineas: number
}

const ESTADO_LABEL: Record<string, { texto: string; color: string }> = {
  ingresado: { texto: "Ingresado", color: "bg-gray-100 text-gray-700" },
  en_separacion: { texto: "En separación", color: "bg-yellow-100 text-yellow-700" },
  separado: { texto: "Separado", color: "bg-blue-100 text-blue-700" },
  comprometido: { texto: "Comprometido", color: "bg-purple-100 text-purple-700" },
  remisionado: { texto: "Remisionado", color: "bg-green-100 text-green-700" },
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

  const handleComprometer = async (id: number) => {
    if (!confirm("¿Confirmas comprometer el inventario de este pedido? Los elementos separados dejarán de estar disponibles para otros clientes.")) return

    setComprometiendo(id)
    try {
      await api.post(`/pedido_comprometer/${id}`)
      await cargarPedidos()
    } catch (err: any) {
      alert(err?.response?.data?.error || "Error al comprometer el inventario")
    } finally {
      setComprometiendo(null)
    }
  }

  const handleRemisionar = async (id: number) => {
    if (!confirm("¿Confirmas crear la remisión de este pedido en SIESA?")) return

    setRemisionando(id)
    try {
      await api.post(`/pedido_remisionar/${id}`)
      await cargarPedidos()
    } catch (err: any) {
      alert(err?.response?.data?.error || "Error al remisionar el pedido")
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
    } catch (err: any) {
      alert(err?.response?.data?.error || "Error al eliminar el pedido")
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Pedidos</h1>
        <div className="flex gap-2">
          <button
            onClick={cargarPedidos}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          <button
            onClick={() => navigate("/comercial/nuevo")}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusCircle size={16} /> Nuevo Pedido
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Pedido</th>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-left px-4 py-2">Cliente</th>
              <th className="text-left px-4 py-2">Líneas</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const estado = ESTADO_LABEL[p.estado] || { texto: p.estado, color: "bg-gray-100 text-gray-700" }
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.f430_consec_docto}</td>
                  <td className="px-4 py-2">{p.f430_id_fecha || "—"}</td>
                  <td className="px-4 py-2">{p.f200_razon_social_pedido_fact}</td>
                  <td className="px-4 py-2">{p.total_lineas}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                      {estado.texto}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {(
                        <button
                          onClick={() => navigate(`/comercial/detalle/${p.id}`)}
                          title="Ver detalle del pedido"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {p.estado !== "remisionado" && (
                        <button
                          title="Eliminar pedido"
                          onClick={() => handleEliminar(p.id, p.f430_consec_docto)}
                          disabled={eliminando === p.id}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      {p.estado === "separado" && (
                        <button
                          onClick={() => handleComprometer(p.id)}
                          disabled={comprometiendo === p.id}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-700 disabled:opacity-50"
                        >
                          <Lock size={14} />
                          {comprometiendo === p.id ? "Comprometiendo..." : "Comprometer"}
                        </button>
                      )}

                      {(p.estado === "separado" || p.estado === "comprometido") && (
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