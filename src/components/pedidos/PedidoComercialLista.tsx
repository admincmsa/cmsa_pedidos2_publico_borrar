import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { AlertTriangle, Eye, RefreshCcwDot } from "lucide-react"
import { estadoPedido, alertaSiesa } from "../../utils/estadosPedido"
import { useRefrescoAutomatico } from "../../utils/useRefrescoAutomatico"
import { kg } from "../../bodega/carrete"
import BarraEstados from "./BarraEstados"
import { cuentaEl, grupoDe, hoyLocal, type Grupo } from "../../utils/gruposPedido"
import Chip from "../ui/Chip"
import Aviso, { type TipoAviso } from "../ui/Aviso"

/**
 * Pedidos para comercial: una tabla del sistema de diseño (encabezado azul,
 * zebra) para seguir cada pedido. Aquí no se compromete ni se remisiona:
 *
 * - los pedidos entran solos desde Siesa cada 10 minutos (/pedidos_importacion);
 * - bodega compromete en Siesa lo separado al pulsar «Terminar»;
 * - la remisión se hace en Siesa y la importación deja el pedido Cumplido.
 *
 * Desde aquí solo se abre el pedido. Ni comercial ni bodega lo quitan de la app:
 * un pedido que no va se anula en Siesa y la importación lo muestra con su aviso.
 */

interface Importacion {
  activa: boolean
  cada_min: number
  ultima_revision: string | null
  ultimo_resultado: { importados: number[]; errores: string[] } | null
}

// La revisión llega en UTC sin zona; se muestra en la hora de la tablet.
function horaLocal(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
}

interface PedidoResumen {
  id: number
  f430_consec_docto: number
  f430_id_fecha: string | null
  f200_razon_social_pedido_fact: string
  estado: string
  estado_siesa: number | null
  remision: string | null
  fecha_ingreso?: string | null
  fecha_remisionado?: string | null
  total_lineas: number
  resumen_cobre?: { calibres: number[]; kg_pedidos: number; kg_separados: number; lineas: number; listas: number }
}

// Los botones de la fila no abren el pedido: la fila entera sí.
const soloBoton = (accion: () => void) => (e: MouseEvent) => {
  e.stopPropagation()
  accion()
}

export default function PedidoComercialLista() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: TipoAviso; titulo: string; detalle?: string } | null>(null)
  // Lo que cuenta es el día: los abiertos hasta esa fecha y los cumplidos de ese día.
  const [fecha, setFecha] = useState(hoyLocal)
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [importacion, setImportacion] = useState<Importacion | null>(null)

  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    try {
      const [res, imp] = await Promise.all([
        api.get("/pedidos_listar"),
        api.get("/pedidos_importacion").catch(() => null),
      ])
      setPedidos(res.data)
      if (imp) setImportacion(imp.data)
    } catch (err) {
      console.error(err)
      setAviso({ tipo: "error", titulo: "No se pudieron cargar los pedidos", detalle: "Revise la conexión con el servidor." })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])
  useRefrescoAutomatico(cargarPedidos)

  const visibles = useMemo(
    () => pedidos.filter((p) => cuentaEl(p, fecha) && (!grupo || grupoDe(p) === grupo)),
    [pedidos, fecha, grupo],
  )

  return (
    <div className="flex min-h-screen flex-col">
      <BarraEstados pedidos={pedidos} fecha={fecha} onFecha={setFecha} seleccionado={grupo} onSeleccionar={setGrupo} />

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-[32px] text-cmsa-azul">Pedidos</h1>
            <p className="mt-1 text-[15px] text-cmsa-gris">
              Bodega compromete en Siesa al terminar; la remisión se hace en Siesa.
            </p>
          </div>
          {importacion && (
            <div className="flex items-center gap-2 text-[14px] text-cmsa-gris" title="Los pedidos comprometidos en Siesa que llevan cobre entran solos">
              <RefreshCcwDot size={16} />
              {importacion.activa
                ? `Entran solos de Siesa cada ${importacion.cada_min} min · última revisión ${horaLocal(importacion.ultima_revision) ?? "—"}`
                : "La importación automática de Siesa está apagada"}
              {(importacion.ultimo_resultado?.errores.length ?? 0) > 0 && (
                <span className="font-semibold text-[#8A1B12]">· la última revisión falló</span>
              )}
            </div>
          )}
        </div>

        {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}

        <div className="overflow-x-auto rounded-xl border border-cmsa-borde bg-white">
          {/* Anchos fijos y proporcionados para la tablet de 10"; el cliente se parte en dos líneas si no cabe */}
          <table className="tabla-cmsa table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[33%]" />
              <col className="w-[15%]" />
              <col className="w-[17%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Calibres</th>
                {/* !: .tabla-cmsa th pone text-left; Kilos va centrado entre Calibres y Estado */}
                <th className="!text-center">Kilos</th>
                <th>Estado</th>
                <th className="!text-center">Ver</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const estado = estadoPedido(p.estado)
                const alerta = alertaSiesa(p.estado, p.estado_siesa)
                const r = p.resumen_cobre
                const calibres = r?.calibres ?? []
                const verPedido = () => navigate(`/comercial/detalle/${p.id}`)
                return (
                  <tr key={p.id} onClick={verPedido} title="Ver el pedido" className="cursor-pointer hover:[&>td]:bg-cmsa-azul/5">
                    <td className="whitespace-nowrap">
                      <div className="display text-[20px] text-cmsa-tinta">{p.f430_consec_docto}</div>
                      <div className="mt-0.5 text-[13px] text-cmsa-gris">{p.f430_id_fecha || "—"}</div>
                    </td>
                    <td className="font-semibold">{p.f200_razon_social_pedido_fact}</td>
                    <td className="whitespace-nowrap">{calibres.length > 0 ? `AWG ${calibres.join(" - ")}` : "—"}</td>
                    <td className="whitespace-nowrap text-center tabular-nums">
                      {r && r.kg_pedidos > 0 ? (
                        <>
                          <b>{kg(r.kg_separados)}</b>
                          <span className="text-cmsa-gris"> / {kg(r.kg_pedidos)} kg</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Chip tono={estado.tono}>{estado.texto}</Chip>
                      {estado.clave === "cumplido" && p.remision && (
                        <div className="mt-1 text-[13px] text-cmsa-gris">{p.remision}</div>
                      )}
                      {alerta && (
                        <div className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-[#8A1B12]">
                          <AlertTriangle size={13} /> {alerta}
                        </div>
                      )}
                    </td>
                    {/* La fila abre el detalle (carretes); el ojo, el pedido completo como en papel,
                        con todas las familias, para imprimirlo o guardarlo en PDF */}
                    <td className="text-center">
                      <button
                        title="Ver el pedido completo (para imprimir o guardar en PDF)"
                        aria-label={`Ver el pedido ${p.f430_consec_docto} completo`}
                        onClick={soloBoton(() => navigate(`/comercial/detalle/${p.id}/impreso`))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-cmsa-azul hover:bg-cmsa-azul/10"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-cmsa-gris">
                    {pedidos.length === 0
                      ? "No hay pedidos todavía. Los comprometidos en Siesa que llevan cobre aparecen aquí solos."
                      : "No hay pedidos en este filtro para ese día."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
