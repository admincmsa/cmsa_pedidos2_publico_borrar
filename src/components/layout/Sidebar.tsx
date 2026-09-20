import { Link, useLocation, useNavigate } from "react-router-dom"
import { BarChart3, FileSpreadsheet, Warehouse, LogOut } from "lucide-react"
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

  if (!usuario) return null

  const menuVisible = MENU.filter((item) => item.roles.includes(usuario.rol))

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="w-64 h-screen flex flex-col shadow-lg">

      {/* LOGO */}
      <div className="bg-white flex justify-center items-center p-4 border-b">
        <img
          src={logo_cliente}
          alt="Logo"
          className="h-16 object-contain"
        />
      </div>

      {/* MENU + USUARIO (ocupa todo el espacio disponible) */}
      <div
        className="flex-1 flex flex-col p-4 min-h-0"
        style={{ backgroundColor: "#0E4A6E" }}
      >
        <nav className="flex flex-col gap-2">
          {menuVisible.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg text-white text-lg font-bold transition-all duration-200
                  ${active
                    ? "bg-white/30 font-semibold"
                    : "hover:bg-white/20"
                  }
                `}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* ================================================== */}
        {/* USUARIO Y LOGOUT — anclado al fondo con mt-auto */}
        {/* ================================================== */}

        <div className="mt-auto pt-4 border-t border-white/20">
          <div className="px-3 py-2 text-white/90">
            <p className="text-sm font-semibold truncate">{usuario.nombre}</p>
            <p className="text-xs text-white/60 capitalize">{usuario.rol}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg text-white text-base font-medium w-full hover:bg-white/20 transition-all duration-200"
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </div>

      {/* PIE */}
      <div className="text-center text-xs text-gray-400 bg-white py-2">
        Powered by:
      </div>
      <div className="bg-white flex justify-center items-center p-4 border-b">
        <img
          src={logo_tecnoinc}
          alt="Logo"
          className="h-16 object-contain"
        />
      </div>
    </div>
  )
}