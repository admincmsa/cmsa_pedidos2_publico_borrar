import { useEffect, useState } from "react"
import api, { mensajeError } from "../services/api"
import Modal from "../components/ui/Modal"
import { useAuth } from "../context/useAuth"
import { UserPlus, Pencil, KeyRound, UserX, UserCheck, RefreshCw } from "lucide-react"

interface Usuario {
  id: number
  nombre: string
  username: string
  identificacion: string | null
  correo: string | null
  rol: "admin" | "bodega" | "comercial"
  rol_texto: string
  activo: boolean
  fecha_creacion: string | null
}

interface Formulario {
  nombre: string
  identificacion: string
  correo: string
  username: string
  rol: string
  clave: string
  clave2: string
}

const ROLES = [
  { valor: "admin", texto: "Administrador" },
  { valor: "bodega", texto: "Bodega" },
  { valor: "comercial", texto: "Comercial" },
]

const COLOR_ROL: Record<string, string> = {
  admin: "bg-[#FDE7E5] text-[#8A1B12]",
  bodega: "bg-cmsa-amarillo text-cmsa-tinta",
  comercial: "bg-cmsa-azul text-white",
}

const VACIO: Formulario = {
  nombre: "", identificacion: "", correo: "", username: "", rol: "comercial", clave: "", clave2: "",
}

const campo =
  "w-full border border-cmsa-borde rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cmsa-azul"

export default function UsuariosPage() {
  const { usuario: yo } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verInactivos, setVerInactivos] = useState(false)

  // Modal crear / editar
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState<Formulario>(VACIO)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Modal asignar contraseña
  const [claveDe, setClaveDe] = useState<Usuario | null>(null)
  const [clave, setClave] = useState({ clave: "", clave2: "" })
  const [errorClave, setErrorClave] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await api.get("/usuarios")
      setUsuarios(res.data)
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar los usuarios"))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(VACIO)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const abrirEditar = (u: Usuario) => {
    setEditando(u)
    setForm({
      nombre: u.nombre, identificacion: u.identificacion || "", correo: u.correo || "",
      username: u.username, rol: u.rol, clave: "", clave2: "",
    })
    setErrorForm(null)
    setModalAbierto(true)
  }

  const cambiar = (k: keyof Formulario, v: string) => {
    const nuevo = { ...form, [k]: v }
    // Al crear, sugiere el usuario a partir del correo (lo que va antes de la @)
    if (!editando && k === "correo" && (!form.username || form.username === form.correo.split("@")[0])) {
      nuevo.username = v.split("@")[0].toLowerCase()
    }
    setForm(nuevo)
  }

  const guardar = async () => {
    setErrorForm(null)
    if (!editando && form.clave !== form.clave2) {
      setErrorForm("Las contraseñas no coinciden")
      return
    }
    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre, identificacion: form.identificacion, correo: form.correo,
        username: form.username, rol: form.rol,
      }
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, datos)
      } else {
        await api.post("/usuarios", { ...datos, clave: form.clave })
      }
      setModalAbierto(false)
      await cargar()
    } catch (err) {
      setErrorForm(mensajeError(err, "No se pudo guardar el usuario"))
    } finally {
      setGuardando(false)
    }
  }

  const cambiarActivo = async (u: Usuario) => {
    const accion = u.activo ? "desactivar" : "activar"
    if (!confirm(`¿Desea ${accion} a ${u.nombre}?${u.activo ? " No podrá ingresar a la aplicación." : ""}`)) return
    try {
      await api.put(`/usuarios/${u.id}/activo`, { activo: !u.activo })
      await cargar()
    } catch (err) {
      alert(mensajeError(err, `No se pudo ${accion} el usuario`))
    }
  }

  const asignarClave = async () => {
    setErrorClave(null)
    if (clave.clave !== clave.clave2) {
      setErrorClave("Las contraseñas no coinciden")
      return
    }
    try {
      const res = await api.put(`/usuarios/${claveDe!.id}/clave`, { clave: clave.clave })
      alert(res.data?.mensaje || "Contraseña asignada")
      setClaveDe(null)
    } catch (err) {
      setErrorClave(mensajeError(err, "No se pudo asignar la contraseña"))
    }
  }

  const visibles = usuarios.filter((u) => verInactivos || u.activo)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="display text-[28px] text-cmsa-azul">Usuarios</h1>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1 text-sm text-cmsa-gris mr-2">
            <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} />
            Ver inactivos
          </label>
          <button
            onClick={cargar}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-cmsa-borde text-cmsa-tinta hover:bg-cmsa-niebla"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-cmsa-azul text-white hover:bg-cmsa-azul-profundo"
          >
            <UserPlus size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[#8A1B12] mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-cmsa-borde overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cmsa-azul text-white">
            <tr>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Identificación</th>
              <th className="text-left px-4 py-2">Correo</th>
              <th className="text-left px-4 py-2">Usuario</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id} className={`border-t ${u.activo ? "" : "text-cmsa-gris"}`}>
                <td className="px-4 py-2 font-medium">{u.nombre}</td>
                <td className="px-4 py-2">{u.identificacion || <span className="text-orange-500">Falta</span>}</td>
                <td className="px-4 py-2">{u.correo || <span className="text-orange-500">Falta</span>}</td>
                <td className="px-4 py-2 font-mono">{u.username}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${COLOR_ROL[u.rol] || ""}`}>
                    {u.rol_texto}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.activo ? "bg-[#DDF3E6] text-[#0B5E34]" : "bg-cmsa-niebla text-cmsa-gris"
                  }`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <button title="Editar" onClick={() => abrirEditar(u)}
                      className="p-1.5 rounded-lg text-cmsa-azul hover:bg-cmsa-niebla">
                      <Pencil size={16} />
                    </button>
                    <button title="Asignar contraseña"
                      onClick={() => { setClaveDe(u); setClave({ clave: "", clave2: "" }); setErrorClave(null) }}
                      className="p-1.5 rounded-lg text-cmsa-tinta hover:bg-cmsa-niebla">
                      <KeyRound size={16} />
                    </button>
                    {u.id !== yo?.id && (
                      <button title={u.activo ? "Desactivar" : "Activar"} onClick={() => cambiarActivo(u)}
                        className={`p-1.5 rounded-lg ${u.activo ? "text-[#8A1B12] hover:bg-red-100" : "text-green-600 hover:bg-green-100"}`}>
                        {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!cargando && visibles.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-cmsa-gris">No hay usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREAR / EDITAR */}
      <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)}
        title={editando ? `Editar usuario ${editando.username}` : "Nuevo usuario"}>
        <div className="space-y-3">
          <div>
            <label className="block text-[15px] text-cmsa-tinta mb-1">Nombre completo</label>
            <input className={campo} value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[15px] text-cmsa-tinta mb-1">Identificación</label>
              <input className={campo} value={form.identificacion}
                onChange={(e) => cambiar("identificacion", e.target.value)} />
            </div>
            <div>
              <label className="block text-[15px] text-cmsa-tinta mb-1">Rol</label>
              <select className={campo} value={form.rol} onChange={(e) => cambiar("rol", e.target.value)}>
                {ROLES.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[15px] text-cmsa-tinta mb-1">Correo</label>
            <input type="email" className={campo} value={form.correo} onChange={(e) => cambiar("correo", e.target.value)} />
          </div>
          <div>
            <label className="block text-[15px] text-cmsa-tinta mb-1">Usuario para ingresar</label>
            <input className={`${campo} font-mono`} value={form.username}
              onChange={(e) => cambiar("username", e.target.value.toLowerCase())} />
          </div>
          {!editando && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[15px] text-cmsa-tinta mb-1">Contraseña inicial</label>
                <input type="password" className={campo} value={form.clave}
                  onChange={(e) => cambiar("clave", e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-[15px] text-cmsa-tinta mb-1">Repetir contraseña</label>
                <input type="password" className={campo} value={form.clave2}
                  onChange={(e) => cambiar("clave2", e.target.value)} autoComplete="new-password" />
              </div>
              <p className="col-span-2 text-xs text-cmsa-gris">
                Mínimo 8 caracteres, con letras y números. El usuario puede cambiarla después.
              </p>
            </div>
          )}

          {errorForm && <p className="text-sm text-[#8A1B12] whitespace-pre-line">{errorForm}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalAbierto(false)}
              className="px-4 py-2 rounded-lg border border-cmsa-borde text-cmsa-tinta hover:bg-cmsa-niebla">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="px-4 py-2 rounded-lg bg-cmsa-azul text-white hover:bg-cmsa-azul-profundo disabled:opacity-50">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ASIGNAR CONTRASEÑA */}
      <Modal isOpen={!!claveDe} onClose={() => setClaveDe(null)} title={`Asignar contraseña a ${claveDe?.nombre ?? ""}`}>
        <div className="space-y-3">
          <p className="text-sm text-cmsa-gris">
            Úselo cuando el usuario olvidó su contraseña. Entréguele la nueva y pídale que la cambie al ingresar.
          </p>
          <input type="password" placeholder="Nueva contraseña" className={campo} value={clave.clave}
            onChange={(e) => setClave({ ...clave, clave: e.target.value })} autoComplete="new-password" />
          <input type="password" placeholder="Repetir contraseña" className={campo} value={clave.clave2}
            onChange={(e) => setClave({ ...clave, clave2: e.target.value })} autoComplete="new-password" />
          {errorClave && <p className="text-sm text-[#8A1B12]">{errorClave}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setClaveDe(null)}
              className="px-4 py-2 rounded-lg border border-cmsa-borde text-cmsa-tinta hover:bg-cmsa-niebla">
              Cancelar
            </button>
            <button onClick={asignarClave}
              className="px-4 py-2 rounded-lg bg-cmsa-azul text-white hover:bg-cmsa-azul-profundo">
              Asignar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
