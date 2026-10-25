import { useState, type ReactNode } from "react"
import api from "../services/api"
import { AuthContext, type Usuario } from "./useAuth"

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
