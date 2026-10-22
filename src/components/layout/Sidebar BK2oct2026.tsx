import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  FileSpreadsheet,
  Warehouse,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import logo_cliente from "../../logo-cmsa.png"
import logo_tecnoinc from "../../Logo-Isashii2-1.png"

interface MenuItem {
  name: string
  path: string
  icon: any
  roles: string[]
}

const MENU: MenuItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "comercial", "bodega"],
  },
  {
    name: "Pedidos",
    path: "/comercial",
    icon: FileSpreadsheet,
    roles: ["admin", "comercial"],
  },
  {
    name: "Pedidos por Separar",
    path: "/bodega",
    icon: Warehouse,
    roles: ["admin", "bodega"],
  },
]

export function Sidebar() {

  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const [colapsado, setColapsado] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_colapsado") === "true"
  })

  if (!usuario) return null

  const menuVisible = MENU.filter((item) => item.roles.includes(usuario.rol))

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleColapsado = () => {
    const nuevoValor = !colapsado
    setColapsado(nuevoValor)
    localStorage.setItem("sidebar_colapsado", String(nuevoValor))
  }

  return (
    <div
      className={`h-screen flex flex-col shadow-lg transition-all duration-200 ${
        colapsado ? "w-20" : "w-64"
      }`}
    >

      {/* LOGO */}
      <div className="bg-white flex justify-center items-center p-4 border-b relative">
        {!colapsado && (
          <img
            src={logo_cliente}
            alt="Logo"
            className="h-16 object-contain"
          />
        )}

        <button
          onClick={toggleColapsado}
          title={colapsado ? "Expandir menú" : "Contraer menú"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50 text-gray-500"
        >
          {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* MENU + USUARIO (ocupa todo el espacio disponible) */}
      <div
        className="flex-1 flex flex-col p-3 min-h-0"
        style={{ backgroundColor: "#1800B1" }}
      >
        <nav className="flex flex-col gap-2">
          {menuVisible.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={colapsado ? item.name : undefined}
                className={`flex items-center gap-3 p-3 rounded-lg text-white text-lg font-bold transition-all duration-200
                  ${colapsado ? "justify-center" : ""}
                  ${active
                    ? "bg-white/30 font-semibold"
                    : "hover:bg-white/20"
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                {!colapsado && item.name}
              </Link>
            )
          })}
        </nav>

        {/* ================================================== */}
        {/* USUARIO Y LOGOUT — anclado al fondo con mt-auto */}
        {/* ================================================== */}

        <div className="mt-auto pt-4 border-t border-white/20">

          {!colapsado && (
            <div className="px-3 py-2 text-white/90">
              <p className="text-sm font-semibold truncate">{usuario.nombre}</p>
              <p className="text-xs text-white/60 capitalize">{usuario.rol}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={colapsado ? "Salir" : undefined}
            className={`flex items-center gap-3 p-3 rounded-lg text-white text-base font-medium w-full hover:bg-white/20 transition-all duration-200
              ${colapsado ? "justify-center" : ""}
            `}
          >
            <LogOut size={18} className="shrink-0" />
            {!colapsado && "Salir"}
          </button>
        </div>
      </div>

      {/* PIE */}
      <div className="bg-white border-t">
        {!colapsado && (
          <div className="text-center text-xs text-gray-400 py-2">
            Powered by:
          </div>
        )}
        <div className="flex justify-center items-center p-3">
          <img
            src={logo_tecnoinc}
            alt="Logo"
            className={colapsado ? "h-8 object-contain" : "h-16 object-contain"}
          />
        </div>
      </div>

    </div>
  )
}