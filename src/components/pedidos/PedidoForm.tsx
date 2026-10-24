import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, Search } from "lucide-react"
import api, { mensajeError } from "../../services/api"
import { awgDeItem, esCobre } from "../../bodega/carrete"
import Boton from "../ui/Boton"
import Chip from "../ui/Chip"
import Aviso from "../ui/Aviso"
import TituloSeccion from "../ui/TituloSeccion"

/**
 * Nuevo pedido: comercial escribe el número del pedido de Siesa, la app lo
 * lee de allá y lo muestra como el documento (chip del pedido, panel de
 * datos, tabla de ítems). Al guardar, queda en la lista para que bodega lo
 * separe. Solo las líneas de cobre se separan con la pistola; las demás se
 * marcan para que comercial lo sepa desde aquí.
 */

interface DetalleItem {
  f120_id: number | string
  f120_referencia: string
  f120_descripcion: string
  f431_cant_pedida_base: number | string
  f431_precio_unitario_base: number | string
  f431_vlr_bruto: number | string
  f431_vlr_neto: number | string
}

interface PedidoSiesa {
  f430_consec_docto: string | number
  f430_id_fecha: string
  f200_razon_social_pedido_fact: string
  f431_notas: string
  direccion_envio: string | null
  ciudad_envio: string | null
  depto_envio: string | null
  detalle: DetalleItem[]
}

const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 })
const numero = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

// Siesa puede enviar los valores como texto: se convierten a número
const aNumero = (valor: unknown): number => {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

export default function PedidoForm({ onCreated }: { onCreated?: () => void }) {
  const navigate = useNavigate()
  const [consecDocto, setConsecDocto] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pedido, setPedido] = useState<PedidoSiesa | null>(null)

  const buscar = async () => {
    const consec = consecDocto.trim()
    if (!consec) {
      setError("Escriba el número del pedido antes de buscar.")
      return
    }
    setBuscando(true)
    setError(null)
    setPedido(null)
    try {
      const res = await api.get("/pedido_listar_activo", { params: { f430_consec_docto: consec } })
      const registros = res.data
      if (!Array.isArray(registros) || registros.length === 0) {
        setError(`El pedido ${consec} no está en Siesa, o no está aprobado.`)
        return
      }
      // La cabecera sale del primer registro; cada registro es una línea.
      const primero = registros[0]
      setPedido({
        f430_consec_docto: primero.f430_consec_docto,
        f430_id_fecha: primero.f430_id_fecha,
        f200_razon_social_pedido_fact: primero.f200_razon_social_pedido_fact,
        f431_notas: primero.f431_notas,
        direccion_envio: primero.direccion_envio ?? null,
        ciudad_envio: primero.ciudad_envio ?? null,
        depto_envio: primero.depto_envio ?? null,
        detalle: registros.map((r: DetalleItem) => ({
          f120_id: r.f120_id,
          f120_referencia: r.f120_referencia,
          f120_descripcion: r.f120_descripcion,
          f431_cant_pedida_base: r.f431_cant_pedida_base,
          f431_precio_unitario_base: r.f431_precio_unitario_base,
          f431_vlr_bruto: r.f431_vlr_bruto,
          f431_vlr_neto: r.f431_vlr_neto,
        })),
      })
    } catch (err) {
      setError(mensajeError(err, "No se pudo consultar el pedido en Siesa."))
    } finally {
      setBuscando(false)
    }
  }

  const guardar = async () => {
    if (!pedido) return
    setGuardando(true)
    setError(null)
    try {
      await api.post("/pedido_guardar", {
        f430_consec_docto: pedido.f430_consec_docto,
        f430_id_fecha: pedido.f430_id_fecha,
        f200_razon_social_pedido_fact: pedido.f200_razon_social_pedido_fact,
        f431_notas: pedido.f431_notas,
        direccion_envio: pedido.direccion_envio,
        ciudad_envio: pedido.ciudad_envio,
        depto_envio: pedido.depto_envio,
        detalle: pedido.detalle,
      })
      onCreated?.()
      navigate("/comercial")
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el pedido."))
    } finally {
      setGuardando(false)
    }
  }

  const cancelar = () => {
    setPedido(null)
    setConsecDocto("")
    setError(null)
  }

  const destino = pedido
    ? [pedido.direccion_envio, [pedido.ciudad_envio, pedido.depto_envio].filter(Boolean).join(", ")].filter(Boolean).join(" · ")
    : ""
  const cobre = pedido?.detalle.filter((d) => esCobre(d.f120_id)).length ?? 0
  const totalNeto = pedido?.detalle.reduce((t, d) => t + aNumero(d.f431_vlr_neto), 0) ?? 0

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Boton variante="secundario" onClick={() => navigate("/comercial")} className="h-11 px-4">
          <ChevronLeft size={18} /> Pedidos
        </Boton>
        <h1 className="display text-[32px] text-cmsa-azul">Nuevo pedido</h1>
      </div>

      <div className="rounded-xl border border-cmsa-borde bg-white p-5">
        <TituloSeccion className="mb-3">Pedido en Siesa</TituloSeccion>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            buscar()
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex min-w-[260px] flex-1 flex-col gap-1.5">
            <span className="etiqueta">Número del pedido</span>
            <input
              name="f430_consec_docto"
              inputMode="numeric"
              placeholder="Número de pedido"
              value={consecDocto}
              onChange={(e) => setConsecDocto(e.target.value)}
              className="campo h-12 text-lg"
              autoFocus
            />
          </label>
          <Boton type="submit" disabled={buscando} className="h-12">
            <Search size={18} /> {buscando ? "Buscando…" : "Buscar"}
          </Boton>
        </form>
        <p className="mt-2 text-[14px] text-cmsa-gris">
          Se lee de Siesa tal como está. El pedido debe estar aprobado o comprometido.
        </p>
      </div>

      {error && <Aviso tipo="error" titulo={error} onCerrar={() => setError(null)} />}

      {pedido && (
        <div className="flex flex-col gap-5 rounded-xl border border-cmsa-borde bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tono="amarillo">Pedido # {pedido.f430_consec_docto}</Chip>
            {/* Siesa manda la fecha con hora en ceros: solo el día. */}
            <Chip tono="profundo">{pedido.f430_id_fecha ? String(pedido.f430_id_fecha).slice(0, 10) : "sin fecha"}</Chip>
          </div>

          <div>
            <TituloSeccion className="mb-2">Datos del cliente</TituloSeccion>
            <div className="border border-cmsa-borde bg-cmsa-niebla px-4 py-3.5 text-[15px] leading-relaxed">
              <strong className="text-base">{pedido.f200_razon_social_pedido_fact}</strong>
              <br />
              <b>Despachar a:</b> {destino || "—"}
              {pedido.f431_notas && (
                <>
                  <br />
                  <b>Notas:</b> {pedido.f431_notas}
                </>
              )}
            </div>
          </div>

          <div>
            <TituloSeccion className="mb-2">Ítems del pedido</TituloSeccion>
            <div className="overflow-x-auto">
              <table className="tabla-cmsa">
                <thead>
                  <tr>
                    <th>Ítem</th>
                    <th>Descripción</th>
                    <th>Bodega</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Vlr unitario</th>
                    <th className="text-right">Vlr total</th>
                    <th className="text-right">Con IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalle.map((d) => {
                    const awg = awgDeItem(d.f120_id)
                    return (
                      <tr key={String(d.f120_id)}>
                        <td className="font-semibold">{d.f120_id}</td>
                        <td>{d.f120_descripcion}</td>
                        <td>
                          {awg !== null ? <Chip tono="azul">AWG {awg}</Chip> : <Chip tono="niebla">No se separa</Chip>}
                        </td>
                        <td className="text-right tabular-nums">{numero.format(aNumero(d.f431_cant_pedida_base))}</td>
                        <td className="text-right tabular-nums">{moneda.format(aNumero(d.f431_precio_unitario_base))}</td>
                        <td className="text-right tabular-nums">{moneda.format(aNumero(d.f431_vlr_bruto))}</td>
                        <td className="text-right tabular-nums">{moneda.format(aNumero(d.f431_vlr_neto))}</td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={6} className="text-right font-bold">TOTAL CON IVA</td>
                    <td className="text-right font-extrabold tabular-nums text-cmsa-azul">{moneda.format(totalNeto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[14px] text-cmsa-gris">
              {cobre === 0
                ? "Este pedido no tiene alambre esmaltado de cobre: bodega no tiene nada que escanear."
                : `${cobre} de ${pedido.detalle.length} líneas son alambre esmaltado de cobre y se separan con la pistola.`}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={cancelar}>Cancelar</Boton>
            <Boton onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar pedido"}
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
