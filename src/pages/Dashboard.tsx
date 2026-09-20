import { useEffect, useState } from "react"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Package, Truck, Warehouse, CheckCircle2, Lock } from "lucide-react"

interface DashboardResumen {
  anio: number
  conteo_estados: {
    ingresado: number
    en_separacion: number
    separado: number
    comprometido: number
    remisionado: number
  }
  ingresados_por_mes: number[]
  remisionados_por_mes: number[]
  remisionados_completos: number
  remisionados_incompletos: number
}

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

export default function Dashboard() {

  const { usuario } = useAuth()
  const [resumen, setResumen] = useState<DashboardResumen | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/dashboard_resumen")
        setResumen(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  if (cargando) {
    return <div className="p-6 text-gray-400">Cargando dashboard...</div>
  }

  if (!resumen) {
    return <div className="p-6 text-red-600">No se pudo cargar la información del dashboard.</div>
  }

  const tarjetas = [
    {
      label: "Ingresados",
      valor: resumen.conteo_estados.ingresado,
      icon: Package,
      color: "text-gray-600 bg-gray-100",
    },
    {
      label: "En separación",
      valor: resumen.conteo_estados.en_separacion,
      icon: Warehouse,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      label: "Separados",
      valor: resumen.conteo_estados.separado,
      icon: CheckCircle2,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Comprometidos",
      valor: resumen.conteo_estados.comprometido,
      icon: Lock,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Remisionados",
      valor: resumen.conteo_estados.remisionado,
      icon: Truck,
      color: "text-green-600 bg-green-100",
      detalle: (
        <div className="mt-1 space-y-0.5">
          <p className="text-xs text-green-700">
            Completos: <span className="font-semibold">{resumen.remisionados_completos}</span>
          </p>
          <p className="text-xs text-red-600">
            Incompletos: <span className="font-semibold">{resumen.remisionados_incompletos}</span>
          </p>
        </div>
      ),
    },
  ]

  const maxValor = Math.max(
    ...resumen.ingresados_por_mes,
    ...resumen.remisionados_por_mes,
    1
  )

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bienvenido, {usuario?.nombre} ({usuario?.rol})
      </p>

      {/* ================================================== */}
      {/* TARJETAS DE ESTADO */}
      {/* ================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {tarjetas.map((t) => {
          const Icon = t.icon
          return (
            <div key={t.label} className="bg-white rounded-xl shadow p-5">
              <div className={`inline-flex p-2 rounded-lg mb-3 ${t.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{t.valor}</p>
              <p className="text-sm text-gray-500">{t.label}</p>
              {t.detalle}
            </div>
          )
        })}
      </div>

      {/* ================================================== */}
      {/* GRÁFICA DE BARRAS: INGRESADOS VS REMISIONADOS POR MES */}
      {/* ================================================== */}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">
            Pedidos por mes — {resumen.anio}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Ingresados
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Remisionados
            </span>
          </div>
        </div>

        <div className="flex items-end gap-3 h-64 border-b border-gray-200 pb-2">
          {MESES.map((mes, i) => {
            const valorIngresados = resumen.ingresados_por_mes[i]
            const valorRemisionados = resumen.remisionados_por_mes[i]

            const alturaIngresados = (valorIngresados / maxValor) * 100
            const alturaRemisionados = (valorRemisionados / maxValor) * 100

            return (
              <div key={mes} className="flex-1 flex flex-col items-center h-full">
                <div className="flex items-end gap-1 h-full w-full justify-center">

                  <div className="flex flex-col items-center justify-end h-full w-4">
                    {valorIngresados > 0 && (
                      <span className="text-[10px] text-gray-500 mb-0.5">{valorIngresados}</span>
                    )}
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${alturaIngresados}%`, minHeight: valorIngresados > 0 ? "2px" : "0" }}
                    />
                  </div>

                  <div className="flex flex-col items-center justify-end h-full w-4">
                    {valorRemisionados > 0 && (
                      <span className="text-[10px] text-gray-500 mb-0.5">{valorRemisionados}</span>
                    )}
                    <div
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${alturaRemisionados}%`, minHeight: valorRemisionados > 0 ? "2px" : "0" }}
                    />
                  </div>

                </div>
                <span className="text-xs text-gray-500 mt-2">{mes}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}