import { createContext, useContext, useState, type ReactNode} from "react"
import api from "../services/api"

interface Usuario {
  id: number
  nombre: string
  username: string
  rol: "comercial" | "bodega" | "admin"
}

interface AuthContextType {
  usuario: Usuario | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const guardado = localStorage.getItem("usuario")
    return guardado ? JSON.parse(guardado) : null
  })

  const login = async (username: string, password: string) => {
    const res = await api.post("/login", { username, password })

    localStorage.setItem("token", res.data.token)
    localStorage.setItem("usuario", JSON.stringify(res.data.usuario))

    setUsuario(res.data.usuario)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}