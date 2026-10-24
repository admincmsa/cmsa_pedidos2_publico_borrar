import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
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
import logoCmsa from "../../logo-cmsa.svg"
import iconoCmsa from "../../logo-cmsa-icono.svg"

/**
 * Menú lateral (diseño aprobado del 2026-10-23, lienzo «Menú lateral CMSA»).
 *
 * Abierto (256 px): encabezado blanco de 72 px, el mismo alto que la barra
 * azul de las pantallas, con el logo SVG y el botón «Contraer menú» (‹). Una
 * sola sangría para iconos, textos y pie; opciones de 48 px.
 * Contraído (72 px): el encabezado muestra solo el ícono del resorte y el
 * botón «Expandir menú» (›) baja a la zona azul, encima de los iconos.
 * Pie: iniciales, nombre y rol, y Cambiar contraseña y Salir.
 */

interface MenuItem {
  name: string
  path: string
  icon: LucideIcon
  roles: string[]
}

const MENU: MenuItem[] = [
  { name: "Pedidos por separar", path: "/bodega", icon: Warehouse, roles: ["admin", "bodega"] },
  { name: "Pedidos", path: "/comercial", icon: FileSpreadsheet, roles: ["admin", "comercial"] },
  { name: "Inventario", path: "/inventario", icon: Boxes, roles: ["admin", "comercial", "bodega"] },
  { name: "Usuarios", path: "/usuarios", icon: Users, roles: ["admin"] },
]

const ROL_TEXTO: Record<string, string> = {
  admin: "Administrador",
  bodega: "Bodega",
  comercial: "Comercial",
}

// «Gary Pinto» → «GP»
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

// Foco solo con teclado, en azul CMSA (no el anillo del navegador al tocar).
const FOCO = "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
// El botón de contraer/expandir: recuadro lavanda con la flecha en azul profundo.
const BOTON_PLEGAR = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECEEFB] text-cmsa-azul-profundo hover:bg-[#DCDFF7] focus-visible:outline-cmsa-azul ${FOCO}`

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const [colapsado, setColapsado] = useState<boolean>(() => localStorage.getItem("sidebar_colapsado") === "true")

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

  // Opción del menú o del pie: misma sangría en abierto; centrada en contraído.
  const opcion = (activo: boolean, alto: string) =>
    `flex ${alto} items-center rounded-[10px] transition-colors focus-visible:outline-white ${FOCO} ${
      colapsado ? "w-12 justify-center" : "gap-3 pl-2 pr-3"
    } ${activo ? "bg-cmsa-azul font-bold text-white shadow-[inset_4px_0_0_#F2DE3D]" : "font-medium text-[#E4E6F7] hover:bg-white/10"}`

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-cmsa-azul-profundo text-white transition-[width] duration-200 ${
        colapsado ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Encabezado blanco de 72 px */}
      <div
        className={`flex h-[72px] shrink-0 items-center border-b border-cmsa-borde bg-white ${
          colapsado ? "justify-center" : "justify-between gap-2 pl-4 pr-3"
        }`}
      >
        {colapsado ? (
          <img src={iconoCmsa} alt="CMSA" className="block w-10" />
        ) : (
          <>
            <img src={logoCmsa} alt="CMSA · Transformer and Lighting Technologies" className="block w-44 min-w-0" />
            <button onClick={toggleColapsado} aria-label="Contraer menú" title="Contraer menú" className={BOTON_PLEGAR}>
              <ChevronLeft size={22} strokeWidth={2.25} />
            </button>
          </>
        )}
      </div>

      {/* Contraído: «Expandir menú» arriba de los iconos, en la zona azul */}
      {colapsado && (
        <div className="flex justify-center pb-3 pt-4">
          <button onClick={toggleColapsado} aria-label="Expandir menú" title="Expandir menú" className={BOTON_PLEGAR}>
            <ChevronRight size={22} strokeWidth={2.25} />
          </button>
        </div>
      )}

      <nav aria-label="Principal" className={`flex flex-col gap-1 ${colapsado ? "items-center pb-4" : "px-3 py-4"}`}>
        {!colapsado && (
          <span className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cmsa-sobre-azul">Menú</span>
        )}
        {menuVisible.map((item) => {
          const Icon = item.icon
          const activo = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={activo ? "page" : undefined}
              aria-label={colapsado ? item.name : undefined}
              title={colapsado ? item.name : undefined}
              className={`${opcion(activo, "h-12")} text-[15px]`}
            >
              <span className={`flex justify-center ${colapsado ? "" : "w-7"}`}>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              {!colapsado && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Pie: quién está conectado y sus dos acciones */}
      <div className={`mt-auto flex flex-col gap-1 border-t border-white/15 pb-5 pt-4 ${colapsado ? "items-center" : "px-3"}`}>
        <div className={`flex items-center gap-3 ${colapsado ? "pb-3" : "px-2 pb-3 pt-1"}`}>
          <span
            aria-hidden="true"
            title={colapsado ? `${usuario.nombre} · ${ROL_TEXTO[usuario.rol] || usuario.rol}` : undefined}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cmsa-amarillo text-sm font-extrabold tracking-[0.02em] text-cmsa-tinta"
          >
            {iniciales(usuario.nombre)}
          </span>
          {!colapsado && (
            <span className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[15px] font-bold leading-tight">{usuario.nombre}</span>
              <span className="text-[11px] font-semibold uppercase leading-tight tracking-[0.14em] text-cmsa-sobre-azul">
                {ROL_TEXTO[usuario.rol] || usuario.rol}
              </span>
            </span>
          )}
        </div>

        <Link
          to="/cambiar-clave"
          aria-label={colapsado ? "Cambiar contraseña" : undefined}
          title={colapsado ? "Cambiar contraseña" : undefined}
          className={`${opcion(location.pathname.startsWith("/cambiar-clave"), "h-11")} text-sm`}
        >
          <span className={`flex justify-center ${colapsado ? "" : "w-7"}`}>
            <KeyRound size={18} strokeWidth={1.75} />
          </span>
          {!colapsado && "Cambiar contraseña"}
        </Link>

        <button
          onClick={handleLogout}
          aria-label={colapsado ? "Salir" : undefined}
          title={colapsado ? "Salir" : undefined}
          className={`${opcion(false, "h-11")} text-left text-sm`}
        >
          <span className={`flex justify-center ${colapsado ? "" : "w-7"}`}>
            <LogOut size={18} strokeWidth={1.75} />
          </span>
          {!colapsado && "Salir"}
        </button>
      </div>
    </aside>
  )
}
