import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { mensajeError } from "../services/api"
import logo_cmsa from "../logo-cmsa.png"
import logo_isashi from "../Logo-Isashii2-1.png"

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
    } catch (err) {
      setError(mensajeError(err, "Usuario o contraseña incorrectos"))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-cmsa-niebla">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4"
      >
        <div className="flex flex-col items-center mb-2">
          <img src={logo_cmsa} alt="CMSA" className="h-14 object-contain mb-3" />
          <h1 className="text-xl font-semibold text-cmsa-tinta">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-cmsa-gris">Inicia sesión para continuar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-cmsa-tinta mb-1">
            Usuario
          </label>
          <input
            className="w-full border border-cmsa-borde rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cmsa-azul"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cmsa-tinta mb-1">
            Contraseña
          </label>
          <input
            type="password"
            className="w-full border border-cmsa-borde rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cmsa-azul"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-cmsa-azul text-white py-2 rounded-lg hover:bg-cmsa-azul-profundo disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {/* Firma del desarrollador. El PNG trae fondo blanco: multiply lo funde con el fondo. */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cmsa-gris">
          Powered by
        </span>
        <img
          src={logo_isashi}
          alt="IsashiIA"
          className="h-14 object-contain mix-blend-multiply"
        />
      </div>
    </div>
  )
}