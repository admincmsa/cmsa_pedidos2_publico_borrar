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
 * Los datos se leen de Siesa en el momento (/pedido_listar_activo), no de la
 * base de la app: las cantidades comprometidas son las de Siesa.
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
}

// Alto de la tabla de ítems en la hoja, en puntos: encabezado + filas + relleno.
const ALTO_TABLA = 397.2
const ALTO_ENCABEZADO = 13.8
const ALTO_FILA = 16.56

const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-CO")
const cantidad = (n: number | undefined) => (n ?? 0).toFixed(4)

function fecha(iso: string | null) {
  if (!iso) return ""
  const [a, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${a}`
}

export default function PedidoImpreso() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [lineas, setLineas] = useState<LineaSiesa[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const pedido = await api.get(`/pedido_detalle/${pedidoId}`)
        const siesa = await api.get("/pedido_listar_activo", {
          params: { f430_consec_docto: pedido.data.f430_consec_docto },
        })
        setLineas(siesa.data)
      } catch (err) {
        setError(mensajeError(err, "No se pudo leer el pedido en Siesa"))
      }
    })()
  }, [pedidoId])

  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!lineas) return <div className="p-6 text-gray-400">Leyendo el pedido en Siesa…</div>
  if (lineas.length === 0) return <div className="p-6 text-red-600">Siesa no devolvió líneas para este pedido.</div>

  const p = lineas[0]
  const bruto = lineas.reduce((s, l) => s + (l.f431_vlr_bruto ?? 0), 0)
  const neto = lineas.reduce((s, l) => s + (l.f431_vlr_neto ?? 0), 0)
  const notas = [...new Set(lineas.map((l) => l.f431_notas).filter(Boolean))].join("\n")
  const ciudad = [p.ciudad_envio, p.depto_envio].filter(Boolean).join(", ")
  const relleno = Math.max(0, ALTO_TABLA - ALTO_ENCABEZADO - lineas.length * ALTO_FILA)
  const numero = `${p.f430_id_co}-${p.f430_id_tipo_docto}-${String(p.f430_consec_docto).padStart(8, "0")}`

  return (
    <div className="pv-fondo">
      <div className="pv-barra">
        <button onClick={() => navigate(-1)}>Volver</button>
        <button className="pv-principal" onClick={() => window.print()}>Imprimir</button>
      </div>

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
          <p><b>Teléfono:</b></p>
        </div>

        <div className="pv-caja pv-datos">
          <p><b>Fecha:</b>{fecha(p.f430_id_fecha)}</p>
          <p><b>Orden de compra:</b></p>
          <p><b>Forma de Pago:</b></p>
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
            {lineas.map((l) => (
              <tr key={String(l.f120_id) + l.f120_descripcion}>
                <td className="pv-desc">
                  <div>{String(l.f120_id).padStart(8, "0")} {l.f120_descripcion}</div>
                </td>
                <td className="pv-um">{l.f431_id_unidad_medida ?? ""}</td>
                <td>{cantidad(l.f431_cant_pedida_base)}</td>
                <td>{cantidad(l.f431_cant_comprometida_base)}</td>
                <td></td>
                <td></td>
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

        <div className="pv-pie">
          <span>REIMPRESO</span>
          <span>ORIGINAL</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  )
}
