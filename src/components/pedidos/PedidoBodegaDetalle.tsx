import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import api, { mensajeError } from "../../services/api"
import { ChevronLeft, ScanLine, Trash2, User } from "lucide-react"
import {
  awgDeItem, esCobre, esLecturaCompleta, kg, leerCodigo, rangoCarrete,
} from "../../bodega/carrete"
import { CMSA, ESTADO } from "../../theme/cmsa"

/**
 * Separación de un pedido en bodega, con la pistola QR en una tablet de 10".
 *
 * El operario solo escanea: la lectura se agrega sola al terminar en `#P#` (o
 * al escribir los 8 dígitos del carrete si el QR está dañado), el carrete cae
 * en la línea de su calibre sin que haya que tocarla, y el campo se vacía
 * siempre, también cuando hay error.
 */

const AZUL = CMSA.azul
const CONDENSADA = "'Barlow Condensed', 'Arial Narrow', sans-serif"

/** Lo que el backend acepta de más sobre lo pedido (INV_TOLERANCIA_EXCESO). */
const TOLERANCIA_EXCESO_PCT = 0

interface Serial {
  id: number
  serial: string
  peso_kg: number
  awg: number | null
  tipo_carrete: string | null
  codigo_proveedor: string | null
  usuario: string | null
  fecha_escaneo: string | null
  pendiente_packing?: boolean
}

interface LineaDetalle {
  id: number
  f120_id: string
  f120_referencia: string
  f120_descripcion: string
  f431_cant_pedida_base: number
  estado_linea: string
  peso_acumulado: number
  seriales: Serial[]
}

interface PedidoDetalle {
  id: number
  f430_consec_docto: number
  f200_razon_social_pedido_fact: string
  f431_notas: string | null
  estado: string
  direccion_envio: string | null
  ciudad_envio: string | null
  depto_envio: string | null
  detalle: LineaDetalle[]
}

type Aviso = { tipo: "ok" | "error"; titulo: string; detalle: string }

/** Una lectura lista para mandar al backend, ya ubicada en su línea. */
interface Lectura {
  linea: LineaCalculada
  serie: string
  kilos: number | null
  manual: boolean
  lectura: string
}

/** Lo que responde el backend cuando el carrete no está en el inventario. */
interface RespuestaRolloNoExiste {
  codigo: "ROLLO_NO_EXISTE"
  puede_agregar: boolean
  carrete: { serial: string; peso_kg: number; awg: number; item_siesa: number; tipo_carrete: string }
}

/** Carrete fuera del inventario que el operario puede agregar como pendiente de packing. */
type CarreteNuevo = RespuestaRolloNoExiste["carrete"] & { lectura: Lectura }

/** Una línea de cobre con sus cuentas ya hechas. */
interface LineaCalculada extends LineaDetalle {
  awg: number
  pedido: number
  separado: number
  falta: number
  /** Peso del carrete más liviano de ese calibre: si falta menos, ya no cabe otro. */
  minCarrete: number
  estado: "Pendiente" | "Separando" | "Lista"
  pct: number
}

function calcular(linea: LineaDetalle): LineaCalculada {
  const pedido = Number(linea.f431_cant_pedida_base || 0)
  const separado = Number(linea.peso_acumulado || 0)
  const falta = Math.max(pedido - separado, 0)
  const { min } = rangoCarrete(linea.f120_descripcion)
  const estado = linea.seriales.length === 0 ? "Pendiente" : falta < min ? "Lista" : "Separando"
  return {
    ...linea,
    awg: awgDeItem(linea.f120_id) ?? 0,
    pedido,
    separado,
    falta,
    minCarrete: min,
    estado,
    pct: pedido > 0 ? Math.min(100, (separado / pedido) * 100) : 0,
  }
}

const COLOR_ESTADO = {
  Lista: { barra: ESTADO.ok, chip: "bg-emerald-100 text-emerald-800" },
  Separando: { barra: AZUL, chip: "bg-cmsa-amarillo text-cmsa-tinta" },
  Pendiente: { barra: CMSA.gris, chip: "bg-cmsa-niebla text-cmsa-gris" },
} as const

export default function PedidoBodegaDetalle() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [texto, setTexto] = useState("")
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [porQuitar, setPorQuitar] = useState<Serial | null>(null)
  const [confirmarFin, setConfirmarFin] = useState(false)
  const [carreteNuevo, setCarreteNuevo] = useState<CarreteNuevo | null>(null)

  const campo = useRef<HTMLInputElement>(null)
  const enfocar = () => campo.current?.focus()

  const cargarPedido = useCallback(async () => {
    try {
      const res = await api.get(`/pedido_detalle/${pedidoId}`)
      setPedido(res.data)
      return res.data as PedidoDetalle
    } catch {
      setAviso({
        tipo: "error",
        titulo: "No se pudo cargar el pedido",
        detalle: "Revise la conexión con el servidor y vuelva a intentar.",
      })
      return null
    }
  }, [pedidoId])

  useEffect(() => {
    cargarPedido()
  }, [cargarPedido])

  // Líneas de cobre: son las únicas que se separan con la pistola.
  const lineas = useMemo<LineaCalculada[]>(
    () => (pedido?.detalle ?? []).filter((d) => esCobre(d.f120_id)).map(calcular),
    [pedido],
  )
  const otras = (pedido?.detalle ?? []).length - lineas.length

  // La línea seleccionada: la elegida, o la primera que falte por separar.
  const actual = useMemo(() => {
    if (!lineas.length) return null
    return lineas.find((l) => l.id === seleccion) ?? lineas.find((l) => l.estado !== "Lista") ?? lineas[0]
  }, [lineas, seleccion])

  // La pistola escribe donde esté el foco: el campo lo recupera siempre.
  useEffect(() => {
    enfocar()
  }, [actual?.id, pedido, guardando])

  const fallar = (titulo: string, detalle: string, linea?: number) => {
    setTexto("")
    setAviso({ tipo: "error", titulo, detalle })
    if (linea) setSeleccion(linea)
    enfocar()
  }

  const procesar = async (entrada: string) => {
    if (guardando) return
    const res = leerCodigo(entrada)
    if (!res.ok) return fallar(res.titulo, res.detalle)

    const { serie, manual, texto: original } = res.lectura
    let { kilos, awg } = res.lectura

    // La serie escrita a mano no trae calibre ni peso: salen del inventario, para
    // que el carrete también vaya solo a su línea. Si no está (o no hay
    // conexión), va a la línea seleccionada y el backend valida.
    if (manual) {
      setGuardando(true)
      try {
        const { data } = await api.get("/inventario_rollos", { params: { serie, solo_disponibles: 0 } })
        const rollo = Array.isArray(data) ? data.find((r: { serie: string }) => r.serie === serie) : null
        if (rollo) {
          awg = rollo.awg ?? null
          kilos = Number(rollo.kilos_iniciales) || null
        }
      } catch {
        // sigue sin calibre
      } finally {
        setGuardando(false)
      }
    }

    // El carrete va solo a la línea de su calibre.
    let destino = actual
    if (awg !== null) {
      const porCalibre = lineas.find((l) => l.awg === awg)
      if (!porCalibre) {
        return fallar(
          `Este carrete es AWG ${awg}`,
          `El pedido no lleva AWG ${awg}. Déjelo en su lugar y escanee otro.`,
        )
      }
      destino = porCalibre
    }
    if (!destino) {
      return fallar("El pedido no tiene líneas de cobre", "No hay nada que separar con la pistola en este pedido.")
    }

    // Ya leído, en esta línea o en otra.
    const repetido = lineas.some((l) => l.seriales.some((s) => String(s.serial).trim() === serie))
    if (repetido) {
      return fallar(`Carrete ${serie} ya leído`, "Ese carrete ya está en este pedido.", destino.id)
    }

    // No pasarse de lo pedido: Siesa rechaza el compromiso completo si se excede.
    if (kilos !== null) {
      const limite = destino.pedido * (1 + TOLERANCIA_EXCESO_PCT / 100)
      if (destino.separado + kilos > limite + 0.005) {
        return fallar(
          "No cabe: se pasaría de lo pedido",
          `Con este carrete (${kg(kilos)} kg) el AWG ${destino.awg} quedaría en ` +
            `${kg(destino.separado + kilos)} de ${kg(destino.pedido)} kg. Déjelo en su lugar.`,
          destino.id,
        )
      }
    }

    await registrar({ linea: destino, serie, kilos, manual, lectura: original })
  }

  // Manda la lectura al backend. Con agregar=true, el backend crea antes el
  // carrete en el inventario como pendiente de packing list.
  const registrar = async (
    { linea: destino, serie, kilos, manual, lectura }: Lectura,
    agregar = false,
  ) => {
    setSeleccion(destino.id)
    setGuardando(true)
    setTexto("")
    try {
      const res = await api.post("/pedido_serial_agregar", {
        pedido_detalle_id: destino.id,
        codigo_escaneado: lectura,
        agregar_a_inventario: agregar,
      })
      const fresco = await cargarPedido()
      const linea = fresco?.detalle.find((d) => d.id === destino.id)
      const r = linea ? calcular(linea) : null
      const peso = kilos ?? (r ? r.separado - destino.separado : 0)
      const avance = !r
        ? ""
        : r.estado === "Lista"
          ? `Calibre listo: faltan ${kg(r.falta)} kg y ya no cabe otro carrete.`
          : `Faltan ${kg(r.falta)} kg en este calibre.`
      setAviso({
        tipo: "ok",
        titulo: `+ ${kg(peso)} kg · carrete ${serie} · AWG ${destino.awg}`,
        detalle: res.data?.alta_manual ? `${avance} ${res.data.mensaje ?? ""}`.trim() : avance,
      })
    } catch (err) {
      const respuesta = axios.isAxiosError(err) ? err.response : undefined
      const datos = respuesta?.data as RespuestaRolloNoExiste | undefined
      if (respuesta?.status === 404 && datos?.codigo === "ROLLO_NO_EXISTE") {
        // El carrete no está en el inventario (stock viejo sin packing cargado).
        if (datos.puede_agregar) {
          setAviso(null)
          setCarreteNuevo({ lectura: { linea: destino, serie, kilos, manual, lectura }, ...datos.carrete })
        } else {
          fallar(
            `El carrete ${serie} no está en el inventario`,
            "Agregar carretes desde bodega está apagado. Déjelo aparte y avise para cargar su packing list.",
          )
        }
        return
      }
      // El título corto y fijo; el motivo del backend, que puede ser largo, abajo.
      fallar(
        `No se agregó el carrete ${serie}`,
        mensajeError(
          err,
          manual ? "Revise el número o escanee el QR." : "Escanee otra vez; si vuelve a fallar, avise.",
        ),
      )
    } finally {
      setGuardando(false)
      enfocar()
    }
  }

  const alEscribir = (valor: string) => {
    if (esLecturaCompleta(valor)) procesar(valor)
    else setTexto(valor)
  }

  const quitar = async () => {
    const s = porQuitar
    setPorQuitar(null)
    if (!s) return
    try {
      await api.delete(`/pedido_serial_eliminar/${s.id}`)
      await cargarPedido()
      setAviso({ tipo: "ok", titulo: `Carrete ${s.serial} quitado`, detalle: `Se devolvieron ${kg(s.peso_kg)} kg.` })
    } catch (err) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo quitar el carrete",
        detalle: mensajeError(err, "Intente otra vez."),
      })
    } finally {
      enfocar()
    }
  }

  const finalizar = async () => {
    setConfirmarFin(false)
    setFinalizando(true)
    try {
      await api.put(`/pedido_finalizar_separacion/${pedidoId}`)
      navigate("/bodega")
    } catch (err) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo terminar la separación",
        detalle: mensajeError(err, "Intente otra vez."),
      })
    } finally {
      setFinalizando(false)
    }
  }

  if (!pedido) return <div className="p-8 text-xl text-cmsa-gris">Cargando pedido…</div>

  const listas = lineas.filter((l) => l.estado === "Lista").length
  const faltan = lineas.length - listas
  const destinoEnvio = [pedido.direccion_envio, [pedido.ciudad_envio, pedido.depto_envio].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex h-screen flex-col bg-cmsa-niebla text-cmsa-tinta">
      <header className="flex h-[72px] flex-shrink-0 items-center gap-5 px-6 text-white" style={{ background: AZUL }}>
        <button
          onClick={() => navigate("/bodega")}
          className="flex h-12 items-center gap-2 rounded-xl bg-white/15 px-4 text-lg font-semibold"
        >
          <ChevronLeft size={20} /> Pedidos
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-3xl font-bold leading-none" style={{ fontFamily: CONDENSADA }}>
            Pedido {pedido.f430_consec_docto}
          </div>
          <div className="truncate text-base opacity-90">
            {pedido.f200_razon_social_pedido_fact}
            {destinoEnvio && (
              <>
                {" · "}
                <b>Despachar a:</b> {destinoEnvio}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-base">
          <User size={22} />
          {localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")!).nombre : "Bodega"}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 px-6 py-5">
        <section aria-label="Calibres del pedido" className="flex w-[300px] flex-shrink-0 flex-col gap-3 overflow-auto">
          <div className="text-[15px] font-bold uppercase tracking-wider text-cmsa-gris">
            Calibres · {listas} de {lineas.length} listos
          </div>

          {lineas.map((l) => {
            const color = COLOR_ESTADO[l.estado]
            const elegida = l.id === actual?.id
            return (
              <button
                key={l.id}
                onClick={() => {
                  setSeleccion(l.id)
                  setAviso(null)
                  enfocar()
                }}
                className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-left shadow-sm"
                style={{ border: `3px solid ${elegida ? AZUL : "transparent"}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[34px] font-bold leading-none" style={{ fontFamily: CONDENSADA }}>
                    AWG {l.awg}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-[15px] font-bold ${color.chip}`}>{l.estado}</span>
                </div>
                <div className="text-[15px] text-cmsa-gris">Ítem {l.f120_id}</div>
                <div className="h-2.5 overflow-hidden rounded-full bg-cmsa-borde">
                  <div className="h-full" style={{ width: `${l.pct}%`, background: color.barra }} />
                </div>
                <div className="text-lg font-semibold">
                  {kg(l.separado)} de {kg(l.pedido)} kg · {l.seriales.length} carrete(s)
                </div>
              </button>
            )
          })}

          {otras > 0 && (
            <p className="px-1 text-[15px] text-cmsa-gris">
              {otras} línea(s) del pedido no son alambre esmaltado de cobre: no se separan aquí.
            </p>
          )}
        </section>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {actual && (
            <div className="flex flex-shrink-0 flex-col gap-3.5 rounded-2xl bg-white px-6 py-5 shadow-sm">
              <div className="flex items-baseline gap-3.5">
                <span className="text-[40px] font-bold leading-none" style={{ fontFamily: CONDENSADA }}>
                  AWG {actual.awg}
                </span>
                <span className="text-lg text-cmsa-gris">Ítem {actual.f120_id}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Numero etiqueta="PEDIDO" valor={actual.pedido} fondo={CMSA.niebla} color={CMSA.tinta} />
                <Numero etiqueta="SEPARADO" valor={actual.separado} fondo={AZUL} color={CMSA.blanco} />
                <Numero
                  etiqueta={actual.estado === "Lista" ? "FALTA · NO CABE OTRO" : "FALTA"}
                  valor={actual.falta}
                  fondo={actual.estado === "Lista" ? ESTADO.okFondo : CMSA.amarillo}
                  color={actual.estado === "Lista" ? ESTADO.okTexto : CMSA.tinta}
                />
              </div>

              <div className="h-5 overflow-hidden rounded-full bg-cmsa-borde">
                <div
                  className="h-full"
                  style={{ width: `${actual.pct}%`, background: actual.estado === "Lista" ? ESTADO.ok : AZUL }}
                />
              </div>

              <div
                className="text-xl font-semibold"
                style={{ color: actual.estado === "Lista" ? ESTADO.okTexto : CMSA.tinta }}
              >
                {actual.estado === "Pendiente"
                  ? `Escanee el primer carrete AWG ${actual.awg}.`
                  : actual.estado === "Lista"
                    ? `Calibre listo. Faltan ${kg(actual.falta)} kg, menos que un carrete: se despacha así.`
                    : `Siga escaneando hasta acercarse a ${kg(actual.pedido)} kg.`}
              </div>
            </div>
          )}

          <div className="flex flex-shrink-0 flex-col gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
            <label htmlFor="escaneo" className="text-[15px] font-bold uppercase tracking-wider text-cmsa-gris">
              Escanee el carrete
            </label>
            <div
              className="flex h-16 items-center gap-3.5 rounded-xl bg-white px-4"
              style={{ border: `3px solid ${AZUL}` }}
            >
              <ScanLine size={30} color={AZUL} />
              <input
                id="escaneo"
                ref={campo}
                autoFocus
                value={texto}
                onChange={(e) => alEscribir(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    procesar(texto)
                  }
                }}
                onBlur={() => setTimeout(enfocar, 50)}
                placeholder="QR dañado: escriba los 8 dígitos de la serie"
                autoComplete="off"
                inputMode="numeric"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[26px] text-cmsa-tinta"
                style={{ fontFamily: CONDENSADA }}
              />
            </div>

            {aviso && (
              <div
                role="status"
                className="flex flex-col gap-1 rounded-xl px-4 py-3.5"
                style={
                  aviso.tipo === "ok"
                    ? { background: ESTADO.okFondo, color: ESTADO.okTexto }
                    : { background: ESTADO.errorFondo, color: ESTADO.errorTexto }
                }
              >
                <div className="text-2xl font-bold">{aviso.titulo}</div>
                {aviso.detalle && <div className="text-lg">{aviso.detalle}</div>}
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-col rounded-2xl bg-white px-6 py-3.5 shadow-sm">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_64px] gap-3 border-b-2 border-cmsa-borde pb-1.5 text-sm font-bold uppercase tracking-wider text-cmsa-gris">
              <span>Carrete</span>
              <span>Peso</span>
              <span>Tipo</span>
              <span />
            </div>

            {actual && actual.seriales.length === 0 && (
              <div className="py-4 text-lg text-cmsa-gris">Todavía no hay carretes en esta línea.</div>
            )}

            {actual?.seriales.map((s) => (
              <div
                key={s.id}
                className="grid min-h-[52px] grid-cols-[1.4fr_1fr_1fr_64px] items-center gap-3 border-b border-cmsa-borde text-xl"
              >
                <span className="text-2xl font-semibold" style={{ fontFamily: CONDENSADA }}>
                  {s.serial}
                </span>
                <span className="font-semibold">{kg(s.peso_kg)} kg</span>
                <span className="text-base text-cmsa-gris">
                  {/* La base no guarda si se leyó por QR o se escribió: se muestra el carrete. */}
                  {s.tipo_carrete || "—"}
                  {s.pendiente_packing && " · sin packing"}
                </span>
                <button
                  onClick={() => setPorQuitar(s)}
                  aria-label={`Quitar carrete ${s.serial}`}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="flex h-24 flex-shrink-0 items-center justify-end gap-4 px-6 pb-5">
        <button
          onClick={() => (faltan > 0 ? setConfirmarFin(true) : finalizar())}
          disabled={finalizando || lineas.length === 0}
          className="h-16 rounded-2xl px-8 text-[22px] font-bold disabled:opacity-60"
          style={faltan > 0 ? { background: CMSA.borde, color: CMSA.tinta } : { background: ESTADO.ok, color: "#FFFFFF" }}
        >
          {finalizando
            ? "Terminando…"
            : faltan > 0
              ? `Terminar · faltan ${faltan} ${faltan === 1 ? "calibre" : "calibres"}`
              : "Terminar separación"}
        </button>
      </footer>

      {porQuitar && (
        <Dialogo
          titulo={`¿Quitar el carrete ${porQuitar.serial}?`}
          detalle={`Se devuelven ${kg(porQuitar.peso_kg)} kg a la línea. El carrete vuelve a quedar disponible.`}
          confirmar="Quitar"
          onConfirmar={quitar}
          onCancelar={() => {
            setPorQuitar(null)
            enfocar()
          }}
        />
      )}

      {carreteNuevo && (
        <Dialogo
          titulo={`El carrete ${carreteNuevo.serial} no está en el inventario`}
          detalle={
            `AWG ${carreteNuevo.awg} · ${kg(carreteNuevo.peso_kg)} kg · ${carreteNuevo.tipo_carrete}. ` +
            "Se agrega al inventario como pendiente de packing list y queda en este pedido."
          }
          confirmar="Agregar"
          onConfirmar={() => {
            const { lectura } = carreteNuevo
            setCarreteNuevo(null)
            registrar(lectura, true)
          }}
          onCancelar={() => {
            setCarreteNuevo(null)
            enfocar()
          }}
        />
      )}

      {confirmarFin && (
        <Dialogo
          titulo={`Faltan ${faltan} ${faltan === 1 ? "calibre" : "calibres"} por completar`}
          detalle="El pedido pasa a comercial con lo que se logró separar. ¿Terminar de todas formas?"
          confirmar="Terminar así"
          onConfirmar={finalizar}
          onCancelar={() => {
            setConfirmarFin(false)
            enfocar()
          }}
        />
      )}
    </div>
  )
}

function Numero({
  etiqueta,
  valor,
  fondo,
  color,
}: {
  etiqueta: string
  valor: number
  fondo: string
  color?: string
}) {
  return (
    <div className="min-w-0 rounded-xl px-3 py-3" style={{ background: fondo, color }}>
      <div className="text-[15px] font-bold uppercase tracking-wider" style={{ color: color ?? CMSA.gris }}>
        {etiqueta}
      </div>
      <div className="whitespace-nowrap text-[46px] font-bold leading-none tabular-nums" style={{ fontFamily: CONDENSADA }}>
        {kg(valor)}
        <span className="text-[22px]"> kg</span>
      </div>
    </div>
  )
}

/** Confirmación propia: el `confirm()` del navegador no se ve en la tablet. */
function Dialogo({
  titulo,
  detalle,
  confirmar,
  onConfirmar,
  onCancelar,
}: {
  titulo: string
  detalle: string
  confirmar: string
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <p className="mt-2 text-lg text-cmsa-gris">{detalle}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancelar} className="h-14 rounded-xl border-2 border-cmsa-borde px-6 text-lg font-semibold">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="h-14 rounded-xl px-6 text-lg font-bold text-white"
            style={{ background: AZUL }}
          >
            {confirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
