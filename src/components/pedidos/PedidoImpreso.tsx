import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api, { mensajeError } from "../../services/api"
import logo from "../../logo-cmsa.png"
import "./pedidoImpreso.css"

/**
 * El pedido como se ve en papel (el formato de Siesa y del CRM), con todas
 * las líneas: cobre, aluminio, barniz o lo que lleve. Así comercial ve si está
 * completo para remisionar.
 *
 * Los datos se leen de Siesa en el momento (/pedido_listar_activo): las
 * cantidades comprometidas son las de Siesa. Si Siesa no responde, se arma con
 * la base de la app (que la importación pone al día cada 10 minutos) y la
 * barra lo avisa.
 */

interface LineaSiesa {
  f430_consec_docto: number
  f430_id_co: string
  f430_id_tipo_docto: string
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  f200_razon_social_pedido_vend?: string | null
  direccion_envio?: string | null
  ciudad_envio?: string | null
  depto_envio?: string | null
  f120_id: number | string
  f120_descripcion: string
  f431_id_unidad_medida?: string
  f431_cant_pedida_base: number
  f431_cant_comprometida_base?: number
  f431_precio_unitario_base?: number
  f431_vlr_bruto?: number
  f431_vlr_neto?: number
  f431_notas?: string | null
  /** Del encabezado del pedido en Siesa (datos_comerciales del backend). */
  telefono?: string | null
  forma_pago?: string | null
  orden_compra?: string | null
  notas_pedido?: string | null
  /** Lo comprometido de la línea por lote, como lo imprime Siesa (solo con Siesa en línea). */
  compromisos?: { ubicacion: string; lote: string; cantidad: number }[]
}

/** Un renglón de la hoja: la línea entera, o una parte comprometida en un lote. */
interface Renglon {
  linea: LineaSiesa
  comprometida: number | undefined
  lote: string
}

// Como Siesa: un renglón por lote comprometido; la línea sin compromiso, en un solo renglón.
function renglones(lineas: LineaSiesa[]): Renglon[] {
  return lineas.flatMap((linea) =>
    linea.compromisos && linea.compromisos.length > 0
      ? linea.compromisos.map((c) => ({ linea, comprometida: c.cantidad, lote: c.lote }))
      : [{ linea, comprometida: linea.f431_cant_comprometida_base, lote: "" }],
  )
}

// Alto de la tabla de ítems en la hoja, en puntos: encabezado + filas + relleno.
const ALTO_TABLA = 397.2
const ALTO_ENCABEZADO = 13.8
const ALTO_FILA = 16.56

const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-CO")
// Dos decimales: 20.75, no 20.7500
const cantidad = (n: number | undefined) => Number(n ?? 0).toFixed(2)

function fecha(iso: string | null) {
  if (!iso) return ""
  const [a, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${a}`
}

interface PedidoApp {
  f430_consec_docto: number
  f430_id_fecha: string | null
  f430_id_tipo_docto?: string
  f200_razon_social_pedido_fact: string
  f200_razon_social_pedido_vend?: string | null
  f431_notas?: string | null
  direccion_envio?: string | null
  ciudad_envio?: string | null
  depto_envio?: string | null
  detalle: (Partial<LineaSiesa> & { f120_id: string; f120_descripcion: string; f431_cant_pedida_base: number })[]
}

// Las mismas líneas, tomadas de la base de la app (/pedido_detalle).
function lineasDeLaApp(p: PedidoApp): LineaSiesa[] {
  return p.detalle.map((d) => ({
    ...d,
    f430_consec_docto: p.f430_consec_docto,
    f430_id_co: "1",
    f430_id_tipo_docto: p.f430_id_tipo_docto ?? "Z3",
    f430_id_fecha: p.f430_id_fecha,
    f200_razon_social_pedido_fact: p.f200_razon_social_pedido_fact,
    f200_razon_social_pedido_vend: p.f200_razon_social_pedido_vend,
    direccion_envio: p.direccion_envio,
    ciudad_envio: p.ciudad_envio,
    depto_envio: p.depto_envio,
    f431_notas: d.f431_notas,
    notas_pedido: p.f431_notas,
  }))
}

export default function PedidoImpreso() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [lineas, setLineas] = useState<LineaSiesa[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // null: datos de Siesa; texto: por qué se usó la base de la app
  const [sinSiesa, setSinSiesa] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      let pedido
      try {
        pedido = (await api.get(`/pedido_detalle/${pedidoId}`)).data
      } catch (err) {
        setError(mensajeError(err, "No se pudo leer el pedido"))
        return
      }
      try {
        const siesa = await api.get("/pedido_listar_activo", {
          params: { f430_consec_docto: pedido.f430_consec_docto },
        })
        setLineas(siesa.data)
      } catch (err) {
        setSinSiesa(mensajeError(err, "Siesa no respondió"))
        setLineas(lineasDeLaApp(pedido))
      }
    })()
  }, [pedidoId])

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!lineas) return <div className="p-6 text-gray-400">Leyendo el pedido en Siesa…</div>
  if (lineas.length === 0) return <div className="p-6 text-red-600">Siesa no devolvió líneas para este pedido.</div>

  const p = lineas[0]
  const bruto = lineas.reduce((s, l) => s + (l.f431_vlr_bruto ?? 0), 0)
  const neto = lineas.reduce((s, l) => s + (l.f431_vlr_neto ?? 0), 0)
  // Las notas del pedido y, debajo, las de cada línea si las hay
  const notas = [...new Set([p.notas_pedido, ...lineas.map((l) => l.f431_notas)].filter(Boolean))].join("\n")
  const ciudad = [p.ciudad_envio, p.depto_envio].filter(Boolean).join(", ")
  const filas = renglones(lineas)
  const relleno = Math.max(0, ALTO_TABLA - ALTO_ENCABEZADO - filas.length * ALTO_FILA)
  const numero = `${p.f430_id_co}-${p.f430_id_tipo_docto}-${String(p.f430_consec_docto).padStart(8, "0")}`

  return (
    <div className="pv-fondo">
      <div className="pv-barra">
        <button onClick={() => navigate(-1)}>Volver</button>
        <button className="pv-principal" onClick={() => window.print()}>Imprimir o guardar PDF</button>
      </div>
      {sinSiesa && (
        <div className="pv-aviso" title={sinSiesa}>
          Siesa no respondió. Se muestran los datos de la app, al día con la última revisión de Siesa.
        </div>
      )}

      <div className="pv-hoja">
        <img className="pv-logo" src={logo} alt="CMSA" />

        <div className="pv-empresa">
          <h1>CMSA SAS</h1>
          <p>Nit: 811038173</p>
          <p>CALLE 16 No. 45-72</p>
          <p className="pv-tel">Tel: 604 2660502</p>
        </div>

        <div className="pv-numero">
          <h2>PEDIDO DE VENTA</h2>
          <p>No. {numero}</p>
        </div>

        <div className="pv-raya" />
        <h2 className="pv-titulo">PEDIDO DE VENTA</h2>

        <div className="pv-caja pv-cliente">
          <span className="pv-rotulo">Cliente</span>
          <p><b>Nombre:</b>{p.f200_razon_social_pedido_fact}</p>
          <p><b>Dirección:</b>{p.direccion_envio ?? ""}</p>
          <p><b>Ciudad:</b>{ciudad}</p>
          <p><b>Teléfono:</b>{p.telefono ?? ""}</p>
        </div>

        <div className="pv-caja pv-datos">
          <p><b>Fecha:</b>{fecha(p.f430_id_fecha)}</p>
          <p><b>Orden de compra:</b>{p.orden_compra ?? ""}</p>
          <p><b>Forma de Pago:</b>{p.forma_pago ?? ""}</p>
          <p><b>Vendedor:</b>{p.f200_razon_social_pedido_vend ?? ""}</p>
        </div>

        <table className="pv-items">
          <colgroup>
            <col style={{ width: "219.8pt" }} />
            <col style={{ width: "32.9pt" }} />
            <col style={{ width: "50.3pt" }} />
            <col style={{ width: "60.2pt" }} />
            <col style={{ width: "65.9pt" }} />
            <col style={{ width: "54.6pt" }} />
            <col style={{ width: "70.7pt" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="pv-izq">Item</th>
              <th>U.M</th>
              <th className="pv-chico">Cant. Pedida</th>
              <th className="pv-chico">Cant. Compro</th>
              <th>Ubicacion</th>
              <th>Lote</th>
              <th>Precio Unitario</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ linea: l, comprometida, lote }, i) => (
              <tr key={`${l.f120_id}-${lote}-${i}`}>
                <td className="pv-desc">
                  <div>{String(l.f120_id).padStart(8, "0")} {l.f120_descripcion}</div>
                </td>
                <td className="pv-um">{l.f431_id_unidad_medida ?? ""}</td>
                <td>{cantidad(l.f431_cant_pedida_base)}</td>
                <td>{cantidad(comprometida)}</td>
                {/* Ubicación va vacía, como en los pedidos que se imprimen a mano */}
                <td></td>
                <td>{lote}</td>
                <td>{pesos(l.f431_precio_unitario_base ?? 0)}</td>
              </tr>
            ))}
            <tr className="pv-relleno">
              {Array.from({ length: 7 }, (_, i) => (
                <td key={i} style={{ height: `${relleno}pt` }} />
              ))}
            </tr>
          </tbody>
        </table>

        <div className="pv-marco">
          <div className="pv-caja pv-notas">
            <span className="pv-rotulo">Notas</span>
            {notas}
          </div>

          <div className="pv-caja pv-totales">
            <span className="pv-rotulo">Totales</span>
            <p><b>Total Bruto:</b><span>{pesos(bruto)}</span></p>
            <p><b>Descuentos:</b><span>$0</span></p>
            <p><b>Subtotal:</b><span>{pesos(bruto)}</span></p>
            <p><b>Vlr Impuestos:</b><span>{pesos(neto - bruto)}</span></p>
            <p className="pv-total"><span>Total:</span><span>{pesos(neto)}</span></p>
          </div>

          <div className="pv-firma" style={{ left: "23.3pt" }}>Elaborado</div>
          <div className="pv-firma" style={{ left: "204.3pt" }}>Aprobado</div>
          <div className="pv-firma" style={{ left: "379.5pt" }}>Recibido</div>
        </div>

        {/* Sale también en el papel: estos datos son de la app, no confirmados en Siesa */}
        {sinSiesa && (
          <div className="pv-origen">DATOS DE LA APP · SIESA NO RESPONDIÓ AL IMPRIMIR · VERIFICAR EN SIESA</div>
        )}

        <div className="pv-pie">
          <span>REIMPRESO</span>
          <span>ORIGINAL</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  )
}
