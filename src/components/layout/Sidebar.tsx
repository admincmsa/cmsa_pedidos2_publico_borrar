import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  FileSpreadsheet,
  Warehouse,
  Boxes,
  Users,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import logo_cliente from "../../logo-cmsa.png"
import { CMSA } from "../../theme/cmsa"

interface MenuItem {
  name: string
  path: string
  icon: LucideIcon
  roles: string[]
}

const MENU: MenuItem[] = [
  {
    name: "Pedidos por Separar",
    path: "/bodega",
    icon: Warehouse,
    roles: ["admin", "bodega"],
  },
  {
    name: "Administrar Pedidos",
    path: "/comercial",
    icon: FileSpreadsheet,
    roles: ["admin", "comercial"],
  },
  {
    name: "Inventario",
    path: "/inventario",
    icon: Boxes,
    roles: ["admin", "comercial", "bodega"],
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "comercial", "bodega"],
  },
  {
    name: "Usuarios",
    path: "/usuarios",
    icon: Users,
    roles: ["admin"],
  },
]

const ROL_TEXTO: Record<string, string> = {
  admin: "Administrador",
  bodega: "Bodega",
  comercial: "Comercial",
}

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
        colapsado ? "w-16" : "w-52 xl:w-60"
      }`}
    >

      {/* LOGO */}
      <div className="bg-white flex justify-center items-center p-3 border-b border-cmsa-borde relative min-h-[56px]">
        {!colapsado && (
          <img
            src={logo_cliente}
            alt="Logo"
            className="h-10 xl:h-12 object-contain"
          />
        )}

        <button
          onClick={toggleColapsado}
          title={colapsado ? "Expandir menú" : "Contraer menú"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50 text-gray-500"
        >
          {colapsado ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* MENU + USUARIO: el azul llega hasta abajo */}
      <div
        className="flex-1 flex flex-col p-2 min-h-0"
        style={{ backgroundColor: CMSA.azulProfundo }}
      >
        <nav className="flex flex-col gap-1">
          {menuVisible.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={colapsado ? item.name : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-white text-sm xl:text-base font-medium transition-all duration-200
                  ${colapsado ? "justify-center" : ""}
                  ${active
                    ? "font-semibold"
                    : "hover:bg-white/10"
                  }
                `}
                style={active ? { backgroundColor: CMSA.azul, boxShadow: `inset 4px 0 0 ${CMSA.amarillo}` } : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!colapsado && item.name}
              </Link>
            )
          })}
        </nav>

        {/* ================================================== */}
        {/* USUARIO Y LOGOUT — anclado al fondo con mt-auto */}
        {/* ================================================== */}

        <div className="mt-auto pt-2 border-t border-white/20">

          {!colapsado && (
            <div className="px-3 py-1.5 text-white/90">
              <p className="text-xs xl:text-sm font-semibold truncate">{usuario.nombre}</p>
              <p className="text-xs text-cmsa-sobre-azul">{ROL_TEXTO[usuario.rol] || usuario.rol}</p>
            </div>
          )}

          <Link
            to="/cambiar-clave"
            title={colapsado ? "Cambiar contraseña" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-white text-xs xl:text-sm font-medium w-full transition-all duration-200
              ${colapsado ? "justify-center" : ""}
              ${location.pathname.startsWith("/cambiar-clave") ? "bg-white/15" : "hover:bg-white/10"}
            `}
          >
            <KeyRound size={16} className="shrink-0" />
            {!colapsado && "Cambiar contraseña"}
          </Link>

          <button
            onClick={handleLogout}
            title={colapsado ? "Salir" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-white text-xs xl:text-sm font-medium w-full hover:bg-white/10 transition-all duration-200
              ${colapsado ? "justify-center" : ""}
            `}
          >
            <LogOut size={16} className="shrink-0" />
            {!colapsado && "Salir"}
          </button>
        </div>
      </div>

    </div>
  )
}