import { createContext, useContext } from "react"

// El contexto y el hook van aparte de AuthProvider: un archivo con componentes
// solo debe exportar componentes (react-refresh/only-export-components).

export interface Usuario {
  id: number
  nombre: string
  username: string
  rol: "comercial" | "bodega" | "admin"
}

export interface AuthContextType {
  usuario: Usuario | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
