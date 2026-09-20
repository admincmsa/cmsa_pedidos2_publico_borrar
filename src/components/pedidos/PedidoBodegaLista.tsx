import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { ArrowRight, RefreshCw } from "lucide-react"

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  estado: string
  total_lineas: number
}

export default function PedidoBodegaLista() {

  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargando, setCargando] = useState(false)

  const cargarPedidos = async () => {
    setCargando(true)
    try {
      const [ingresados, enSeparacion] = await Promise.all([
        api.get("/pedidos_listar", { params: { estado: "ingresado" } }),
        api.get("/pedidos_listar", { params: { estado: "en_separacion" } }),
      ])
      setPedidos([...ingresados.data, ...enSeparacion.data])
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Pedidos por separar</h1>
        <button
          onClick={cargarPedidos}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div className="grid gap-3">
        {pedidos.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/bodega/${p.id}`)}
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow hover:shadow-md transition text-left"
          >
            <div>
              <p className="font-semibold text-gray-800">Pedido {p.f430_consec_docto}</p>
              <p className="text-sm text-gray-500">{p.f200_razon_social_pedido_fact}</p>
              <p className="text-xs text-gray-400">{p.total_lineas} línea(s) · {p.estado === "ingresado" ? "Sin iniciar" : "En proceso"}</p>
            </div>
            <ArrowRight className="text-gray-400" size={20} />
          </button>
        ))}

        {!cargando && pedidos.length === 0 && (
          <p className="text-center text-gray-400 py-10">No hay pedidos pendientes de separar</p>
        )}
      </div>
    </div>
  )
}