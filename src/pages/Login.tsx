import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import logoCmsa from "../logo-cmsa.png"

export default function Login() {

  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      await login(username, password)
      navigate("/")
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Usuario o contraseña incorrectos"
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4"
      >
        <div className="flex flex-col items-center mb-2">
          <img
            src={logoCmsa}
            alt="Logo CMSA"
            className="h-16 w-auto object-contain mb-4"
          />
          <h1 className="text-xl font-semibold text-gray-800">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  )
}