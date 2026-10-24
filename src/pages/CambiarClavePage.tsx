import { useState } from "react"
import api, { mensajeError } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { KeyRound } from "lucide-react"

const campo =
  "w-full border border-cmsa-borde rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cmsa-azul"

export default function CambiarClavePage() {
  const { usuario } = useAuth()
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [nueva2, setNueva2] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(null)
    if (nueva !== nueva2) {
      setError("La contraseña nueva y su confirmación no coinciden")
      return
    }
    setGuardando(true)
    try {
      const res = await api.put("/cambiar_clave", { clave_actual: actual, clave_nueva: nueva })
      setOk(res.data?.mensaje || "Contraseña actualizada")
      setActual("")
      setNueva("")
      setNueva2("")
    } catch (err) {
      setError(mensajeError(err, "No se pudo cambiar la contraseña"))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="display text-[28px] text-cmsa-azul mb-1 flex items-center gap-2">
        <KeyRound size={20} /> Cambiar contraseña
      </h1>
      <p className="text-sm text-cmsa-gris mb-4">
        {usuario?.nombre} · <span className="font-mono">{usuario?.username}</span>
      </p>

      <form onSubmit={guardar} className="bg-white rounded-xl border border-cmsa-borde p-5 space-y-3">
        <div>
          <label className="block text-[15px] text-cmsa-tinta mb-1">Contraseña actual</label>
          <input type="password" className={campo} value={actual}
            onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="block text-[15px] text-cmsa-tinta mb-1">Contraseña nueva</label>
          <input type="password" className={campo} value={nueva}
            onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="block text-[15px] text-cmsa-tinta mb-1">Repetir contraseña nueva</label>
          <input type="password" className={campo} value={nueva2}
            onChange={(e) => setNueva2(e.target.value)} autoComplete="new-password" />
        </div>
        <p className="text-xs text-cmsa-gris">Mínimo 8 caracteres, con letras y números.</p>

        {error && <p className="text-sm text-[#8A1B12]">{error}</p>}
        {ok && <p className="text-sm text-[#0B5E34]">{ok}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={guardando || !actual || !nueva || !nueva2}
            className="px-4 py-2 rounded-lg bg-cmsa-azul text-white hover:bg-cmsa-azul-profundo disabled:opacity-50">
            {guardando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </div>
  )
}
