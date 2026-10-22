import { useEffect, useState } from "react"
import api, { mensajeError } from "../services/api"
import Modal from "../components/ui/Modal"
import { RefreshCw, Search, History, AlertTriangle } from "lucide-react"

interface ResumenItem {
  id_item: number
  descripcion: string
  awg: number
  rollos_en_bodega: number
  rollos_con_disponible: number
  kilos_existencia: number
  kilos_comprometidos: number
  kilos_disponibles: number
}

interface Rollo {
  serie: string
  id_item: number
  descripcion: string
  awg: number
  kilos_iniciales: number
  kilos_existencia: number
  kilos_comprometidos: number
  kilos_disponibles: number
  estado: string
  bodega: string
  packing: string
  origen?: string
  pendiente?: boolean
}

interface Movimiento {
  id_movimiento: number
  fecha: string
  tipo: string
  kilos: number
  saldo_existencia: number
  saldo_comprometido: number
  pedido: string | null
  documento_siesa: string | null
  usuario: string | null
  lote_siesa?: string | null
}

const COLOR_ESTADO: Record<string, string> = {
  DISPONIBLE: "bg-green-100 text-green-700",
  PARCIAL: "bg-yellow-100 text-yellow-700",
  COMPROMETIDO: "bg-purple-100 text-purple-700",
  DESPACHADO: "bg-gray-100 text-gray-600",
}

const kg = (n: number) =>
  Number(n || 0).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function InventarioPage() {
  const [resumen, setResumen] = useState<ResumenItem[]>([])
  const [itemSel, setItemSel] = useState<ResumenItem | null>(null)
  const [rollos, setRollos] = useState<Rollo[]>([])
  const [soloDisponibles, setSoloDisponibles] = useState(true)
  const [serieBuscar, setSerieBuscar] = useState("")
  // Carretes agregados desde bodega que esperan su packing list
  const [verPendientes, setVerPendientes] = useState(false)
  const [totalPendientes, setTotalPendientes] = useState(0)
  const [kardex, setKardex] = useState<{ serie: string; movs: Movimiento[] } | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarResumen = async () => {
    setError(null)
    try {
      const [res, pend] = await Promise.all([
        api.get("/inventario_resumen"),
        api.get("/inventario_pendientes"),
      ])
      setResumen(res.data)
      setTotalPendientes(pend.data?.pendientes ?? 0)
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el inventario"))
    }
  }

  const cargarRollos = async (item: number | null, serie = "", pendientes = verPendientes) => {
    setCargando(true)
    setError(null)
    try {
      const res = await api.get("/inventario_rollos", {
        params: {
          item: item ?? undefined,
          serie: serie || undefined,
          solo_disponibles: soloDisponibles ? "1" : "0",
          solo_pendientes: pendientes ? "1" : "0",
        },
      })
      setRollos(res.data)
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar los carretes"))
    } finally {
      setCargando(false)
    }
  }

  const verKardex = async (serie: string) => {
    try {
      const res = await api.get(`/inventario_kardex/${serie}`)
      setKardex({ serie, movs: res.data })
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el kardex"))
    }
  }

  useEffect(() => {
    cargarResumen()
  }, [])

  useEffect(() => {
    if (itemSel || serieBuscar || verPendientes) cargarRollos(itemSel?.id_item ?? null, serieBuscar)
  }, [itemSel, soloDisponibles, verPendientes])

  const totales = resumen.reduce(
    (t, r) => ({
      existencia: t.existencia + Number(r.kilos_existencia),
      comprometidos: t.comprometidos + Number(r.kilos_comprometidos),
      disponibles: t.disponibles + Number(r.kilos_disponibles),
      rollos: t.rollos + Number(r.rollos_en_bodega),
    }),
    { existencia: 0, comprometidos: 0, disponibles: 0, rollos: 0 }
  )

  return (
    <div className="p-4 xl:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-base xl:text-xl font-semibold text-gray-800">Inventario de carretes</h1>
        <button
          onClick={cargarResumen}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs xl:text-sm"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && <p className="text-xs xl:text-sm text-red-600 mb-3 whitespace-pre-line">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          ["Carretes en bodega", totales.rollos.toLocaleString("es-CO")],
          ["Existencia (kg)", kg(totales.existencia)],
          ["Comprometidos (kg)", kg(totales.comprometidos)],
          ["Disponibles (kg)", kg(totales.disponibles)],
        ].map(([titulo, valor]) => (
          <div key={titulo} className="bg-white rounded-xl shadow p-3 xl:p-4">
            <p className="text-xs text-gray-500">{titulo}</p>
            <p className="text-base xl:text-xl font-semibold text-gray-800">{valor}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* RESUMEN POR ÍTEM */}
        <div className="bg-white rounded-xl shadow overflow-auto max-h-[calc(100vh-260px)] min-h-[240px]">
          <table className="w-full text-xs xl:text-sm">
            <thead className="bg-gray-50 text-gray-600 sticky top-0">
              <tr>
                <th className="text-left px-3 py-1.5">Ítem</th>
                <th className="text-left px-3 py-1.5">Descripción</th>
                <th className="text-right px-3 py-1.5">Carretes</th>
                <th className="text-right px-3 py-1.5">Comprom.</th>
                <th className="text-right px-3 py-1.5">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr
                  key={r.id_item}
                  onClick={() => { setSerieBuscar(""); setVerPendientes(false); setItemSel(r) }}
                  className={`border-t cursor-pointer hover:bg-blue-50 ${
                    itemSel?.id_item === r.id_item ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-3 py-1.5 font-medium">{r.id_item}</td>
                  <td className="px-3 py-1.5">{r.descripcion}</td>
                  <td className="px-3 py-1.5 text-right">{r.rollos_en_bodega}</td>
                  <td className="px-3 py-1.5 text-right">{kg(r.kilos_comprometidos)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{kg(r.kilos_disponibles)}</td>
                </tr>
              ))}
              {resumen.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Sin inventario cargado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ROLLOS */}
        <div className="bg-white rounded-xl shadow p-3 xl:p-4 flex flex-col max-h-[calc(100vh-260px)] min-h-[240px]">
          <form
            onSubmit={(e) => { e.preventDefault(); setItemSel(null); setVerPendientes(false); cargarRollos(null, serieBuscar.trim(), false) }}
            className="flex gap-2 mb-3"
          >
            <input
              value={serieBuscar}
              onChange={(e) => setSerieBuscar(e.target.value)}
              placeholder="Buscar serie del carrete"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm font-mono"
            />
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs xl:text-sm">
              <Search size={14} />
            </button>
          </form>

          {totalPendientes > 0 && (
            <button
              type="button"
              onClick={() => { setItemSel(null); setSerieBuscar(""); setVerPendientes(true) }}
              className={`flex items-center gap-1 self-start mb-2 px-2 py-1 rounded-lg text-xs border ${
                verPendientes
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "border-amber-300 text-amber-700 hover:bg-amber-50"
              }`}
            >
              <AlertTriangle size={12} />
              {totalPendientes} carrete(s) pendiente(s) de packing list
            </button>
          )}

          <div className="flex justify-between items-center mb-2 text-xs xl:text-sm">
            <p className="font-medium text-gray-700">
              {verPendientes
                ? "Carretes pendientes de packing list"
                : itemSel ? `${itemSel.id_item} — ${itemSel.descripcion}` : serieBuscar ? "Resultado de la búsqueda" : "Seleccione un ítem"}
            </p>
            <label className="flex items-center gap-1 text-gray-600">
              <input
                type="checkbox"
                checked={soloDisponibles}
                onChange={(e) => setSoloDisponibles(e.target.checked)}
              />
              Solo con disponible
            </label>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-xs xl:text-sm">
              <thead className="text-gray-500 sticky top-0 bg-white">
                <tr>
                  <th className="text-left py-1">Serie</th>
                  <th className="text-right py-1">Inicial</th>
                  <th className="text-right py-1">Existencia</th>
                  <th className="text-right py-1">Disponible</th>
                  <th className="text-left py-1 pl-3">Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rollos.map((r) => (
                  <tr key={r.serie} className="border-t">
                    <td className="py-1 font-mono">
                      {r.serie}
                      {r.pendiente && (
                        <span
                          title="Agregado desde bodega: pendiente de packing list"
                          className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-sans bg-amber-100 text-amber-800"
                        >
                          Pendiente packing
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-right">{kg(r.kilos_iniciales)}</td>
                    <td className="py-1 text-right">{kg(r.kilos_existencia)}</td>
                    <td className="py-1 text-right font-medium">{kg(r.kilos_disponibles)}</td>
                    <td className="py-1 pl-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${COLOR_ESTADO[r.estado] || ""}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="py-1 text-right">
                      <button
                        onClick={() => verKardex(r.serie)}
                        title="Ver movimientos"
                        className="p-1 rounded text-blue-600 hover:bg-blue-100"
                      >
                        <History size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && rollos.length === 0 && (itemSel || serieBuscar) && (
                  <tr><td colSpan={6} className="text-center py-4 text-gray-400">Sin carretes</td></tr>
                )}
              </tbody>
            </table>
            {cargando && <p className="text-center py-4 text-gray-400">Cargando...</p>}
          </div>
        </div>
      </div>

      <Modal isOpen={!!kardex} onClose={() => setKardex(null)} title={`Movimientos del rollo ${kardex?.serie ?? ""}`}>
        <table className="w-full text-xs">
          <thead className="text-gray-500">
            <tr>
              <th className="text-left py-1">Fecha</th>
              <th className="text-left py-1">Tipo</th>
              <th className="text-right py-1">Kg</th>
              <th className="text-right py-1">Exist.</th>
              <th className="text-right py-1">Comp.</th>
              <th className="text-left py-1 pl-2">Documento</th>
              <th className="text-left py-1 pl-2">Lote Siesa</th>
            </tr>
          </thead>
          <tbody>
            {kardex?.movs.map((m) => (
              <tr key={m.id_movimiento} className="border-t">
                <td className="py-1">{new Date(m.fecha).toLocaleString("es-CO")}</td>
                <td className="py-1">{m.tipo}</td>
                <td className="py-1 text-right">{kg(m.kilos)}</td>
                <td className="py-1 text-right">{kg(m.saldo_existencia)}</td>
                <td className="py-1 text-right">{kg(m.saldo_comprometido)}</td>
                <td className="py-1 pl-2">{m.documento_siesa || m.pedido || "—"}</td>
                <td className="py-1 pl-2 font-mono">
                  {m.lote_siesa && m.lote_siesa !== kardex?.serie
                    ? <span className="text-amber-700" title="Comprometido por peso en lote genérico">{m.lote_siesa}</span>
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  )
}
