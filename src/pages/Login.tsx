import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { mensajeError } from "../services/api"
import logo_cmsa from "../logo-cmsa.png"
import logo_isashi from "../Logo-Isashii2-1.png"
import Boton from "../components/ui/Boton"
import Aviso from "../components/ui/Aviso"

/**
 * Ingreso. Es la primera pantalla que ve el operario en la tablet: campos
 * altos para tocarlos con el dedo y el error en la propia tarjeta.
 */
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cmsa-niebla px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-cmsa-borde bg-white p-8"
      >
        <div className="mb-2 flex flex-col items-center text-center">
          <img src={logo_cmsa} alt="CMSA" className="mb-4 h-14 object-contain" />
          <h1 className="display text-[26px] text-cmsa-azul">Gestión de pedidos</h1>
          <p className="mt-1 text-[15px] text-cmsa-gris">Inicie sesión para continuar</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="etiqueta">Usuario</span>
          <input
            className="campo h-12"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="etiqueta">Contraseña</span>
          <input
            type="password"
            className="campo h-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <Aviso tipo="error" titulo={error} />}

        <Boton type="submit" disabled={cargando} className="mt-2 h-12 w-full">
          {cargando ? "Ingresando…" : "Ingresar"}
        </Boton>
      </form>

      {/* Firma del desarrollador. El PNG trae fondo blanco: multiply lo funde con el fondo. */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cmsa-gris">Powered by</span>
        <img src={logo_isashi} alt="IsashiIA" className="h-14 object-contain mix-blend-multiply" />
      </div>
    </div>
  )
}
