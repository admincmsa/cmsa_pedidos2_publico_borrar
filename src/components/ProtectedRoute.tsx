import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface Props {
  children: React.ReactNode
  rolesPermitidos?: string[]
}

export default function ProtectedRoute({ children, rolesPermitidos }: Props) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}