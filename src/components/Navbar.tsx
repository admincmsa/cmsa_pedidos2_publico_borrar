import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LogOut, Package, Warehouse } from "lucide-react"

export default function Navbar() {
  const { usuario, logout } = useAuth()
  const location = useLocation()

  if (!usuario || location.pathname === "/login") return null

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-800">Gestión de Pedidos</span>

        {(usuario.rol === "comercial" || usuario.rol === "admin") && (
          
          <Link to="/comercial" className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
            <Package size={16} /> Comercial
          </Link>
          
        )}

        {(usuario.rol === "bodega" || usuario.rol === "admin") && (
          
          <Link to="/bodega" className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
            <Warehouse size={16} /> Bodega
          </Link>
          
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>{usuario.nombre} <span className="text-gray-400">({usuario.rol})</span></span>
        <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:text-red-700">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </nav>
  )
}