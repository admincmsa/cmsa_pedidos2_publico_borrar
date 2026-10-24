import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import api, { mensajeError } from "../../services/api"
import { ChevronLeft, ScanLine, Trash2, User } from "lucide-react"
import {
  awgDeItem, esCobre, esLecturaCompleta, kg, leerCodigo, lineaLista, rangoCarrete,
} from "../../bodega/carrete"
import { CMSA, DISPLAY, ESTADO } from "../../theme/cmsa"
import Chip, { type TonoChip } from "../ui/Chip"
import { alertaSiesa } from "../../utils/estadosPedido"

/**
 * Separación de un pedido en bodega, con la pistola QR en una tablet de 10".
 *
 * El operario solo escanea: la lectura se agrega sola al terminar en `#P#` (o
 * al escribir los 8 dígitos del carrete si el QR está dañado), el carrete cae
 * en la línea de su calibre sin que haya que tocarla, y el campo se vacía
 * siempre, también cuando hay error.
 */

const AZUL = CMSA.azul


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
  f431_precio_unitario_base?: number | null
  /** Carrete más liviano que queda por separar de ese ítem; null si no hay ninguno. */
  peso_min_disponible?: number | null
  /** Medio carrete del ítem: referencia de cuánto es razonable pasarse (solo informa). */
  exceso_max_kg?: number
  seriales: Serial[]
}

interface PedidoDetalle {
  id: number
  f430_consec_docto: number
  f200_razon_social_pedido_fact: string
  f431_notas: string | null
  estado: string
  estado_siesa?: number | null
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
  /** Lo separado por encima de lo pedido. */
  sobra: number
  /** Carrete más liviano que se puede agregar: el real del inventario, o el nominal de la descripción. */
  minCarrete: number
  estado: "Pendiente" | "Separando" | "Lista"
  /** Solo en líneas listas: verde bien, amarillo diferencia cara, rojo sobra un carrete. */
  semaforo: Semaforo | null
  pct: number
}

function calcular(linea: LineaDetalle): LineaCalculada {
  const pedido = Number(linea.f431_cant_pedida_base || 0)
  const separado = Number(linea.peso_acumulado || 0)
  const falta = Math.max(pedido - separado, 0)
  const sobra = Math.max(separado - pedido, 0)
  // El rango de la descripción es nominal: manda el carrete real más liviano que queda.
  // null = no queda ninguno, así que ningún carrete puede acercar la línea.
  const min = linea.peso_min_disponible === null
    ? Infinity
    : (linea.peso_min_disponible ?? rangoCarrete(linea.f120_descripcion).min)
  // Lista: ya llegó a lo pedido, o ni el carrete más liviano la dejaría más cerca.
  // La tolerancia solo informa: no hay tope (el cliente aprueba la diferencia).
  const estado = linea.seriales.length === 0
    ? "Pendiente"
    : separado >= pedido || lineaLista(pedido, separado, min, Infinity) ? "Lista" : "Separando"
  return {
    ...linea,
    awg: awgDeItem(linea.f120_id) ?? 0,
    pedido,
    separado,
    falta,
    sobra,
    minCarrete: min,
    estado,
    semaforo: estado === "Lista" ? semaforoDe(linea, pedido, separado) : null,
    pct: pedido > 0 ? Math.min(100, (separado / pedido) * 100) : 0,
  }
}

/*
 * Semáforo de una línea lista. Solo color, sin avisos: bodega agrega lo que
 * tiene a mano y el cliente aprueba la diferencia antes de la remisión.
 *   rojo     sobra un carrete: sin el último escaneado quedaría más cerca de lo pedido
 *   amarillo la diferencia (por arriba o por abajo) vale más que UMBRAL_PESOS
 *   verde    lo demás
 */
type Semaforo = "verde" | "amarillo" | "rojo"

/** Pesos de diferencia a partir de los cuales la línea se pinta en amarillo. */
const UMBRAL_PESOS = 300_000

function semaforoDe(linea: LineaDetalle, pedido: number, separado: number): Semaforo {
  const desvio = separado - pedido
  const ultimo = linea.seriales.reduce<Serial | null>((u, s) => (!u || s.id > u.id ? s : u), null)
  if (ultimo && desvio > 0.005 && Math.abs(desvio - Number(ultimo.peso_kg)) < desvio - 0.005) return "rojo"
  const precio = Number(linea.f431_precio_unitario_base || 0)
  return Math.abs(desvio) * precio > UMBRAL_PESOS ? "amarillo" : "verde"
}

const COLOR_SEMAFORO: Record<Semaforo, { barra: string; tono: TonoChip; fondo: string; texto: string }> = {
  verde: { barra: ESTADO.ok, tono: "ok", fondo: ESTADO.okFondo, texto: ESTADO.okTexto },
  amarillo: { barra: CMSA.amarillo, tono: "alerta", fondo: ESTADO.alertaFondo, texto: ESTADO.alertaTexto },
  rojo: { barra: "#C0392B", tono: "error", fondo: ESTADO.errorFondo, texto: ESTADO.errorTexto },
}

/** Barra y chip de una línea: las listas van con el color de su semáforo. */
function colores(l: LineaCalculada) {
  return l.semaforo ? COLOR_SEMAFORO[l.semaforo] : COLOR_ESTADO[l.estado]
}

const COLOR_ESTADO: Record<LineaCalculada["estado"], { barra: string; tono: TonoChip }> = {
  Lista: { barra: ESTADO.ok, tono: "ok" },
  Separando: { barra: AZUL, tono: "azul" },
  Pendiente: { barra: CMSA.gris, tono: "niebla" },
}

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
  // Pregunta al pulsar Terminar: confirmar, un calibre que todavía lleva otro
  // carrete, o la declaración de que ese carrete no está en la bodega.
  const [confirmarFin, setConfirmarFin] = useState<false | "terminar" | "lleva_otro" | "sin_carretes">(false)
  const [carreteNuevo, setCarreteNuevo] = useState<CarreteNuevo | null>(null)

  const campo = useRef<HTMLInputElement>(null)
  const enfocar = () => campo.current?.focus()

  // Lecturas que llegan mientras se guarda la anterior: esperan en fila y no se pierden.
  const ocupado = useRef(false)
  const cola = useRef<string[]>([])
  const [libre, setLibre] = useState(0)
  // Lecturas recibidas que aún no terminan (la que se guarda más las de la fila):
  // mientras haya alguna, Terminar espera, así la confirmación cuenta todos los carretes.
  const [enCurso, setEnCurso] = useState(0)

  // La pistola es un teclado: su Enter o Tab nunca puede pulsar un botón (Terminar,
  // Quitar…). Fuera del campo se anulan y el foco vuelve al campo; las letras siguen
  // al campo, así una lectura que empezó en otro lado no se pierde.
  useEffect(() => {
    const guardia = (e: KeyboardEvent) => {
      if (e.target === campo.current) return
      if (e.key === "Enter" || e.key === " " || e.key === "Tab") {
        e.preventDefault()
        e.stopPropagation()
      }
      if (e.key.length === 1 || e.key === "Enter") enfocar()
    }
    document.addEventListener("keydown", guardia, true)
    return () => document.removeEventListener("keydown", guardia, true)
  }, [])

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

  // deFila: la lectura ya se contó en enCurso cuando llegó.
  const procesar = async (entrada: string, deFila = false) => {
    if (!entrada.trim()) return // Enter suelto, sin lectura
    if (finalizando) {
      if (deFila) setEnCurso((n) => n - 1)
      return fallar("El pedido se está terminando", "Espere a que Siesa responda: este carrete no se agregó.")
    }
    // Escanear es seguir separando: cierra la pregunta que estuviera abierta.
    setConfirmarFin(false)
    setPorQuitar(null)
    setCarreteNuevo(null)
    if (!deFila) setEnCurso((n) => n + 1)
    if (ocupado.current) {
      cola.current.push(entrada)
      return
    }
    ocupado.current = true
    try {
      await procesarLectura(entrada)
    } finally {
      ocupado.current = false
      setEnCurso((n) => n - 1)
      setLibre((n) => n + 1)
    }
  }

  // La siguiente de la fila, ya con el pedido recargado.
  useEffect(() => {
    const siguiente = cola.current.shift()
    if (siguiente) procesar(siguiente, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libre])

  const procesarLectura = async (entrada: string) => {
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
          ? r.sobra > 0
            ? `Calibre listo: ${kg(r.sobra)} kg por encima de lo pedido.`
            : `Calibre listo: faltan ${kg(r.falta)} kg y ningún carrete lo acerca más.`
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

  // La lectura se manda sola al completarse; el campo queda vacío para que el
  // Enter que la pistola manda detrás no vuelva a procesar el resto.
  const alEscribir = (valor: string) => {
    if (esLecturaCompleta(valor)) {
      setTexto("")
      procesar(valor)
    } else setTexto(valor)
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

  // sinCarretes: ítems que bodega declaró sin carretes en la bodega aunque el inventario diga que hay.
  const finalizar = async (sinCarretes: number[] = []) => {
    setConfirmarFin(false)
    setFinalizando(true)
    try {
      // Terminar compromete en Siesa lo separado (no hay botón Comprometer).
      const res = await api.put(`/pedido_finalizar_separacion/${pedidoId}`, { sin_carretes: sinCarretes })
      const numero = pedido?.f430_consec_docto
      const texto = res.data?.simulacion
        ? `Pedido ${numero} separado. Simulación: no se escribió en Siesa.`
        : `Pedido ${numero} separado y comprometido en Siesa.`
      navigate("/bodega", { state: { aviso: texto } })
    } catch (err) {
      // Siesa no lo aceptó, o el servidor vio un calibre que todavía lleva otro carrete:
      // el pedido sigue en bodega. Se recarga para que calibres, carretes más livianos y
      // estado sean los del servidor (así vuelve a salir «No hay en bodega» si aplica).
      await cargarPedido()
      const datos = axios.isAxiosError(err) ? (err.response?.data as { codigo?: string } | undefined) : undefined
      setAviso({
        tipo: "error",
        titulo: "El pedido no se terminó",
        detalle:
          mensajeError(err, "Intente otra vez.") +
          (datos?.codigo === "CALIBRE_LLEVA_OTRO"
            ? " Si ese carrete no está en la bodega, toque Terminar y elija «No hay en bodega»."
            : ""),
      })
    } finally {
      setFinalizando(false)
    }
  }

  // Sin pedido: o está cargando, o la carga falló (se muestra el motivo y se puede reintentar)
  if (!pedido) {
    if (!aviso) return <div className="p-8 text-xl text-cmsa-gris">Cargando pedido…</div>
    return (
      <div className="flex flex-col items-start gap-4 p-8">
        <div className="rounded-xl px-5 py-4" style={{ background: ESTADO.errorFondo, color: ESTADO.errorTexto }}>
          <div className="text-2xl font-bold">{aviso.titulo}</div>
          <div className="text-lg">{aviso.detalle}</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setAviso(null)
              cargarPedido()
            }}
            className="h-14 rounded-xl px-6 text-lg font-bold text-white"
            style={{ background: AZUL }}
          >
            Reintentar
          </button>
          <button onClick={() => navigate("/bodega")} className="h-14 rounded-xl border-2 border-cmsa-borde px-6 text-lg font-semibold">
            Volver a pedidos
          </button>
        </div>
      </div>
    )
  }

  // Comercial lo anuló, lo retuvo o lo cumplió en Siesa: no se separa (el servidor tampoco lo deja)
  const noVigente = alertaSiesa(pedido.estado, pedido.estado_siesa)

  const listas = lineas.filter((l) => l.estado === "Lista").length
  const faltan = lineas.length - listas
  // Calibres a los que todavía les cabe un carrete del inventario: así no se puede terminar.
  const llevanOtro = lineas.filter((l) => l.minCarrete !== Infinity && !lineaLista(l.pedido, l.separado, l.minCarrete, Infinity))
  const calibresOtro = llevanOtro.map((l) => `AWG ${l.awg}`).join(", ")
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
        {/* Pedido y cliente en la misma línea; la dirección de despacho, sola debajo */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="shrink-0 text-3xl font-bold leading-none" style={DISPLAY}>
              Pedido {pedido.f430_consec_docto}
            </span>
            <span className="truncate text-xl font-semibold">{pedido.f200_razon_social_pedido_fact}</span>
          </div>
          {destinoEnvio && (
            <div className="truncate text-base opacity-90">
              <b>Despachar a:</b> {destinoEnvio}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-base">
          <User size={22} />
          {localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")!).nombre : "Bodega"}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 px-6 py-5">
        {noVigente && (
          <div
            role="alert"
            className="fixed left-1/2 top-[84px] z-40 -translate-x-1/2 rounded-xl px-6 py-3 text-xl font-bold shadow-lg"
            style={{ background: ESTADO.errorFondo, color: ESTADO.errorTexto }}
          >
            {noVigente}: no separe este pedido. Avise a comercial; si tiene carretes, quítelos.
          </div>
        )}
        <section aria-label="Calibres del pedido" className="flex w-[300px] flex-shrink-0 flex-col gap-3 overflow-auto">
          <div className="etiqueta">
            Calibres · {listas} de {lineas.length} listos
          </div>

          {lineas.map((l) => {
            const color = colores(l)
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
                  <span className="text-[34px] font-bold leading-none" style={DISPLAY}>
                    AWG {l.awg}
                  </span>
                  <Chip tono={color.tono}>{l.estado}</Chip>
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
                <span className="text-[40px] font-bold leading-none" style={DISPLAY}>
                  AWG {actual.awg}
                </span>
                <span className="text-lg text-cmsa-gris">Ítem {actual.f120_id}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Numero etiqueta="PEDIDO" valor={actual.pedido} fondo={CMSA.niebla} color={CMSA.tinta} />
                <Numero etiqueta="SEPARADO" valor={actual.separado} fondo={AZUL} color={CMSA.blanco} />
                <Numero
                  etiqueta={
                    actual.sobra > 0 ? "SOBRA" : actual.estado === "Lista" ? "FALTA · LISTO" : "FALTA"
                  }
                  valor={actual.sobra > 0 ? actual.sobra : actual.falta}
                  fondo={actual.semaforo ? COLOR_SEMAFORO[actual.semaforo].fondo : CMSA.niebla}
                  color={actual.semaforo ? COLOR_SEMAFORO[actual.semaforo].texto : CMSA.tinta}
                />
              </div>

              <div className="h-5 overflow-hidden rounded-full bg-cmsa-borde">
                <div
                  className="h-full"
                  style={{ width: `${actual.pct}%`, background: colores(actual).barra }}
                />
              </div>

              <div
                className="text-xl font-semibold"
                style={{ color: actual.semaforo ? COLOR_SEMAFORO[actual.semaforo].texto : CMSA.tinta }}
              >
                {actual.estado === "Pendiente"
                  ? `Escanee el primer carrete AWG ${actual.awg}.`
                  : actual.estado === "Lista"
                    ? actual.sobra > 0
                      ? `Calibre listo: ${kg(actual.sobra)} kg por encima de lo pedido.`
                      : `Calibre listo: faltan ${kg(actual.falta)} kg.`
                    : `Siga escaneando hasta acercarse a ${kg(actual.pedido)} kg.`}
              </div>
            </div>
          )}

          <div className="flex flex-shrink-0 flex-col gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
            <label htmlFor="escaneo" className="etiqueta">
              Escanee el carrete · se agrega solo
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
                  // Enter o Tab (según cómo esté configurada la pistola) cierran la lectura.
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault()
                    setTexto("")
                    procesar(texto)
                  }
                }}
                onBlur={() => setTimeout(enfocar, 50)}
                placeholder="Escanee el carrete o escriba su número, ej. 36763002"
                autoComplete="off"
                inputMode="numeric"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[26px] text-cmsa-tinta"
                style={DISPLAY}
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
            <div className="etiqueta grid grid-cols-[1.4fr_1fr_1fr_64px] gap-3 border-b-2 border-cmsa-borde pb-1.5">
              <span>Carrete</span>
              <span>Peso</span>
              <span>Tipo</span>
              <span />
            </div>

            {actual && actual.seriales.length === 0 && (
              <div className="py-4 text-lg text-cmsa-gris">Todavía no hay carretes en este calibre.</div>
            )}

            {actual?.seriales.map((s) => (
              <div
                key={s.id}
                className="grid min-h-[52px] grid-cols-[1.4fr_1fr_1fr_64px] items-center gap-3 border-b border-cmsa-borde text-xl"
              >
                <span className="text-2xl font-semibold" style={DISPLAY}>
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
        {/* Terminar lo decide una persona: solo un toque (detail 0 = clic de teclado) y siempre con confirmación */}
        <button
          tabIndex={-1}
          onClick={(e) => {
            if (e.detail === 0 || enCurso > 0) return
            setConfirmarFin(llevanOtro.length > 0 ? "lleva_otro" : "terminar")
          }}
          disabled={finalizando || enCurso > 0 || lineas.length === 0 || !!noVigente}
          className="h-16 rounded-2xl px-8 text-[22px] font-bold disabled:opacity-60"
          style={faltan > 0 ? { background: CMSA.borde, color: CMSA.tinta } : { background: ESTADO.ok, color: "#FFFFFF" }}
        >
          {finalizando
            ? "Terminando…"
            : enCurso > 0
              ? "Guardando carrete…"
              : faltan > 0
              ? `Terminar · faltan ${faltan} ${faltan === 1 ? "calibre" : "calibres"}`
              : "Terminar separación"}
        </button>
      </footer>

      {porQuitar && (
        <Dialogo
          titulo={`¿Quitar el carrete ${porQuitar.serial}?`}
          detalle={`Se devuelven ${kg(porQuitar.peso_kg)} kg a este calibre. El carrete vuelve a quedar disponible.`}
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

      {confirmarFin === "lleva_otro" && (
        <Dialogo
          titulo={`${calibresOtro} todavía ${llevanOtro.length === 1 ? "lleva" : "llevan"} otro carrete`}
          detalle={
            llevanOtro
              .map((l) => `AWG ${l.awg}: ${kg(l.separado)} de ${kg(l.pedido)} kg; hay carretes desde ${kg(l.minCarrete)} kg.`)
              .join(" ") + " Escanee otro carrete antes de terminar."
          }
          confirmar="Seguir separando"
          onConfirmar={() => {
            setConfirmarFin(false)
            enfocar()
          }}
          cancelar="No hay en bodega"
          onCancelar={() => setConfirmarFin("sin_carretes")}
        />
      )}

      {confirmarFin === "sin_carretes" && (
        <Dialogo
          titulo={`¿Terminar sin completar ${calibresOtro}?`}
          detalle={
            `Confirme que en la bodega no queda ningún carrete de ${calibresOtro}, aunque el inventario diga que sí. ` +
            "Queda registrado con su nombre y se compromete en Siesa lo separado."
          }
          confirmar="Sí, no hay"
          onConfirmar={() => enCurso === 0 && finalizar(llevanOtro.map((l) => Number(l.f120_id)))}
          onCancelar={() => {
            setConfirmarFin(false)
            enfocar()
          }}
        />
      )}

      {confirmarFin === "terminar" && (
        <Dialogo
          titulo={
            faltan > 0
              ? `Faltan ${faltan} ${faltan === 1 ? "calibre" : "calibres"} por completar`
              : `¿Terminar el pedido ${pedido.f430_consec_docto}?`
          }
          detalle={
            `Se compromete en Siesa lo separado: ${kg(lineas.reduce((t, l) => t + l.separado, 0))} kg en ` +
            `${lineas.reduce((t, l) => t + l.seriales.length, 0)} carrete(s). Después no se pueden agregar ni quitar carretes.` +
            (faltan > 0 ? " El cliente aprueba la diferencia antes de la remisión." : "")
          }
          confirmar={faltan > 0 ? "Terminar así" : "Terminar"}
          onConfirmar={() => enCurso === 0 && finalizar()}
          onCancelar={() => {
            setConfirmarFin(false)
            enfocar()
          }}
        />
      )}

      {finalizando && (
        <div role="alertdialog" aria-live="assertive" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-xl">
            <h2 className="text-3xl font-bold">Comprometiendo en Siesa…</h2>
            <p className="mt-3 text-xl text-cmsa-gris">
              Puede tardar un minuto. No escanee más carretes de este pedido hasta que termine.
            </p>
          </div>
        </div>
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
      <div className="whitespace-nowrap text-[46px] font-bold leading-none tabular-nums" style={DISPLAY}>
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
  cancelar = "Cancelar",
  onCancelar,
}: {
  titulo: string
  detalle: string
  confirmar: string
  onConfirmar: () => void
  cancelar?: string
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <p className="mt-2 text-lg text-cmsa-gris">{detalle}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            tabIndex={-1}
            onClick={(e) => {
              if (e.detail === 0) return
              onCancelar()
            }}
            className="h-14 rounded-xl border-2 border-cmsa-borde px-6 text-lg font-semibold"
          >
            {cancelar}
          </button>
          {/* Confirmar solo con un toque: un Enter de la pistola (detail 0) no confirma nada */}
          <button
            tabIndex={-1}
            onClick={(e) => {
              if (e.detail === 0) return
              onConfirmar()
            }}
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
