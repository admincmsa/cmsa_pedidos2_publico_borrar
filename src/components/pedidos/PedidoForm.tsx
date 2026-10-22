import { useState, useMemo } from "react"
import api from "../../services/api"
import type { ColDef } from "ag-grid-community"
import { AgGridReact, AgGridProvider } from "ag-grid-react"
import { themeBalham } from "ag-grid-community"
import { AllCommunityModule } from "ag-grid-community"
import { useNavigate } from "react-router-dom"

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

interface PedidoFormProps {
  onCreated?: () => void
}

// ==========================================================
// FORMATOS (es-CO): moneda y número
// ==========================================================

const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const formatoNumero = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// Siesa puede enviar los valores como texto: se convierten a número
const aNumero = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

const columnaNumerica = (formato: Intl.NumberFormat): Partial<ColDef<DetalleItem>> => ({
  valueGetter: (p) => aNumero(p.data?.[p.colDef.field as keyof DetalleItem]),
  valueFormatter: (p) => (p.value === null || p.value === undefined ? "" : formato.format(p.value)),
  filter: "agNumberColumnFilter",
  cellStyle: { display: "flex", alignItems: "center", justifyContent: "flex-end" },
})

export default function PedidoForm({
  onCreated,
}: PedidoFormProps) {

  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  const [consecDocto, setConsecDocto] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)

  // ==========================================================
  // PEDIDO ENCONTRADO (CABECERA + DETALLE)
  // ==========================================================

  const [pedido, setPedido] = useState<PedidoSiesa | null>(null)

  // ==========================================================
  // GUARDAR
  // ==========================================================

  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  const navigate = useNavigate()
  // ==========================================================
  // BUSCAR PEDIDO EN SIESA
  // ==========================================================

  const handleBuscarPedido = async () => {

    if (!consecDocto) {
      setErrorBusqueda("Ingrese el número de pedido antes de buscar.")
      return
    }

    setBuscando(true)
    setErrorBusqueda(null)
    setPedido(null)

    try {

      const res = await api.get(
        "/pedido_listar_activo",
        {
          params: {
            f430_consec_docto: consecDocto,
          },
        }
      )

      const registros = res.data

      if (!Array.isArray(registros) || registros.length === 0) {
        setErrorBusqueda("No se encontró el pedido en SIESA.")
        return
      }

      // ==================================================
      // CABECERA: SE TOMA DEL PRIMER REGISTRO
      // ==================================================

      const primero = registros[0]

      const detalle: DetalleItem[] = registros.map((r: any) => ({
        f120_id: r.f120_id,
        f120_referencia: r.f120_referencia,
        f120_descripcion: r.f120_descripcion,
        f431_cant_pedida_base: r.f431_cant_pedida_base,
        f431_precio_unitario_base: r.f431_precio_unitario_base,
        f431_vlr_bruto: r.f431_vlr_bruto,
        f431_vlr_neto: r.f431_vlr_neto,
      }))

      setPedido({
        f430_consec_docto: primero.f430_consec_docto,
        f430_id_fecha: primero.f430_id_fecha,
        f200_razon_social_pedido_fact: primero.f200_razon_social_pedido_fact,
        f431_notas: primero.f431_notas,
        direccion_envio: primero.direccion_envio ?? null,
        ciudad_envio: primero.ciudad_envio ?? null,
        depto_envio: primero.depto_envio ?? null,
        detalle,
      })

    } catch (error: any) {

      console.error(
        "Error consultando pedido_listar_activo:",
        error
      )

      setErrorBusqueda(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Error al consultar el pedido en SIESA."
      )

    } finally {

      setBuscando(false)

    }

  }


  // ==========================================================
  // GUARDAR PEDIDO EN POSTGRESQL
  // ==========================================================

  const handleGuardarPedido = async () => {

    if (!pedido) {
      return
    }

    setGuardando(true)
    setErrorGuardar(null)

    try {

      await api.post(
        "/pedido_guardar",
        {
          f430_consec_docto: pedido.f430_consec_docto,
          f430_id_fecha: pedido.f430_id_fecha,
          f200_razon_social_pedido_fact: pedido.f200_razon_social_pedido_fact,
          f431_notas: pedido.f431_notas,
          direccion_envio: pedido.direccion_envio,
          ciudad_envio: pedido.ciudad_envio,
          depto_envio: pedido.depto_envio,
          detalle: pedido.detalle,
        }
      )

        setPedido(null)
        setConsecDocto("")
        setErrorBusqueda(null)

        navigate("/comercial")

      // ==================================================
      // LIMPIAR FORMULARIO
      // ==================================================

      setPedido(null)
      setConsecDocto("")
      setErrorBusqueda(null)

      if (onCreated) {
        onCreated()
      }

    } catch (error: any) {

      console.error(
        "Error guardando pedido:",
        error
      )

      setErrorGuardar(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Error al guardar el pedido."
      )

    } finally {

      setGuardando(false)

    }

  }


  // ==========================================================
  // AG GRID: MÓDULOS, TEMA Y COLUMNAS
  // ==========================================================

  const modules = [AllCommunityModule]

  const myTheme = themeBalham
    .withParams({
      backgroundColor: '#ffffff',
      foregroundColor: '#070707',
      headerBackgroundColor: '#adacac47',
      headerTextColor: 'black',
      spacing: 4,
      fontSize: 11,
      headerFontSize: 12,
      accentColor: '#b05fee',
    })

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: "header-center",
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
  }
  /*
  const columnDefs: ColDef<DetalleItem>[] = useMemo(() => [
    { field: "f120_id", headerName: "F120_id", width: 130 },
    { field: "f120_referencia", headerName: "Referencia", width: 150 },
    { field: "f120_descripcion", headerName: "Descripción", flex: 1, minWidth: 200 },
    { field: "f431_cant_pedida_base", headerName: "Cant Pedida", width: 130 },
    { field: "f431_precio_unitario_base", headerName: "Vlr Unit", width: 130 },
    { field: "f431_vlr_bruto", headerName: "Vlr Total", width: 130 },
    { field: "f431_vlr_neto", headerName: "Vlr Total IVA", width: 150 },
  ], [])
  */

  const columnDefs: ColDef<DetalleItem>[] = useMemo(() => [
    { field: "f120_id", headerName: "F120_id", width: 130 },
    //{ field: "f120_referencia", headerName: "Referencia", width: 150 },
    { field: "f120_descripcion", headerName: "Descripción", flex: 1, minWidth: 200 },
    { field: "f431_cant_pedida_base", headerName: "Cant Pedida", width: 130, ...columnaNumerica(formatoNumero) },
    { field: "f431_precio_unitario_base", headerName: "Vlr Unit", width: 130, ...columnaNumerica(formatoMoneda) },
    { field: "f431_vlr_bruto", headerName: "Vlr Total", width: 130, ...columnaNumerica(formatoMoneda) },
    { field: "f431_vlr_neto", headerName: "Vlr Total IVA", width: 150, ...columnaNumerica(formatoMoneda) },
  ], [])


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="bg-white p-4 xl:p-6 rounded shadow">

      {/* ================================================== */}
      {/* BUSCADOR */}
      {/* ================================================== */}

      <div className="mb-4">
        <label className="block text-xs xl:text-sm font-medium text-gray-700 mb-1">
          Pedido:
        </label>
        <div className="flex gap-2">
          <input
            name="f430_consec_docto"
            placeholder="Número de pedido"
            value={consecDocto}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onChange={(e) => setConsecDocto(e.target.value)}
          />
          <button
            type="button"
            onClick={handleBuscarPedido}
            disabled={buscando}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs xl:text-sm"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {errorBusqueda && (
          <p className="text-xs xl:text-sm text-red-600 mt-1">
            {errorBusqueda}
          </p>
        )}
      </div>


      {/* ================================================== */}
      {/* RESULTADO DE LA BÚSQUEDA */}
      {/* ================================================== */}

      {pedido && (
        <>

          {/* ---------------------------------------------- */}
          {/* CABECERA EN TEXTO */}
          {/* ---------------------------------------------- */}

          <div className="mb-4 space-y-1 border border-gray-200 rounded-lg p-3 xl:p-4 bg-gray-50">
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Pedido:</span>{" "}
              {pedido.f430_consec_docto}
            </p>
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Fecha:</span>{" "}
              {pedido.f430_id_fecha}
            </p>
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Cliente:</span>{" "}
              {pedido.f200_razon_social_pedido_fact}
            </p>
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Dirección de envío:</span>{" "}
              {pedido.direccion_envio || "—"}
            </p>
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Ciudad:</span>{" "}
              {pedido.ciudad_envio
                ? `${pedido.ciudad_envio}${pedido.depto_envio && pedido.depto_envio !== pedido.ciudad_envio ? `, ${pedido.depto_envio}` : ""}`
                : "—"}
            </p>
            <p className="text-xs xl:text-sm text-gray-800">
              <span className="font-semibold">Notas:</span>{" "}
              {pedido.f431_notas || "—"}
            </p>
          </div>

          {/* ---------------------------------------------- */}
          {/* TABLA AG GRID */}
          {/* ---------------------------------------------- */}

          <div className="mb-4">
            <AgGridProvider modules={modules}>
              <div style={{ width: "100%" }}>
                <AgGridReact<DetalleItem>
                  theme={myTheme}
                  rowData={pedido.detalle}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(params) => String(params.data.f120_id)}
                  domLayout="autoHeight"
                />
              </div>
            </AgGridProvider>
          </div>

          {errorGuardar && (
            <p className="text-xs xl:text-sm text-red-600 mb-2">
              {errorGuardar}
            </p>
          )}

          {/* ---------------------------------------------- */}
          {/* BOTONES */}
          {/* ---------------------------------------------- */}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPedido(null)
                setConsecDocto("")
                setErrorBusqueda(null)
                setErrorGuardar(null)
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs xl:text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarPedido}
              disabled={guardando}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs xl:text-sm"
            >
              {guardando ? "Guardando..." : "Guardar Pedido"}
            </button>
          </div>

        </>
      )}

    </div>
  )
}