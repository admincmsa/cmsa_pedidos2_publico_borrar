
import { useEffect, useRef, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Trash2 } from "lucide-react"

interface SerialLeido {
  id: number
  serial: string
  fecha_hora: string
}

export default function LeerInventario() {

  const [seriales, setSeriales] = useState<SerialLeido[]>([])
  const [ultimoSerial, setUltimoSerial] = useState("")

  // Buffer donde se van acumulando los caracteres
  // enviados por la pistola lectora
  const bufferRef = useRef("")

  // Timer para detectar cuando una lectura ha tardado demasiado
  const timerRef = useRef<number | null>(null)


  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {

      // ENTER = final de la lectura
      if (event.key === "Enter") {

        const serial = bufferRef.current.trim()

        if (serial !== "") {

          agregarSerial(serial)

        }

        bufferRef.current = ""

        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }

        return
      }


      // Ignoramos teclas especiales
      if (event.key.length !== 1) {
        return
      }


      // Agregamos el carácter al buffer
      bufferRef.current += event.key


      // Reiniciamos el timer
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }


      timerRef.current = window.setTimeout(() => {

        bufferRef.current = ""

      }, 300)

    }


    window.addEventListener("keydown", handleKeyDown)


    return () => {

      window.removeEventListener("keydown", handleKeyDown)

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }

    }

  }, [])


  const agregarSerial = (serial: string) => {

    const nuevoSerial: SerialLeido = {
      id: Date.now() + Math.random(),
      serial: serial,
      fecha_hora: new Date().toLocaleString("es-CO")
    }

    setSeriales((actuales) => [
      ...actuales,
      nuevoSerial
    ])

    setUltimoSerial(serial)
  }


  const eliminarSerial = (id: number) => {

    setSeriales((actuales) =>
      actuales.filter((item) => item.id !== id)
    )

  }


  const columnDefs: ColDef<SerialLeido>[] = [

    {
      headerName: "#",
      width: 80,
      valueGetter: (params) => {
        return (params.node?.rowIndex ?? 0) + 1
      },
      sortable: false,
      filter: false
    },

    {
      field: "serial",
      headerName: "Serial",
      flex: 1,
      minWidth: 250,
      sortable: true,
      filter: true
    },

    {
      field: "fecha_hora",
      headerName: "Fecha / Hora",
      width: 220,
      sortable: true
    },

    {
      headerName: "Acciones",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<SerialLeido>) => {

        return (
          <button
            type="button"
            onClick={() => {
              if (params.data) {
                eliminarSerial(params.data.id)
              }
            }}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        )

      }
    }

  ]


  return (

    <div className="bg-white p-4 xl:p-6 rounded shadow">

      {/* ENCABEZADO */}

      <div className="flex items-center justify-between mb-4">

        <div>

          <h2 className="text-base xl:text-lg font-semibold">
            Lectura de Inventario
          </h2>

          <p className="text-xs xl:text-sm text-gray-500 mt-1">
            Escanee los seriales utilizando la pistola lectora
          </p>

        </div>


        <div className="text-right">

          <div className="text-xs xl:text-sm text-gray-500">
            Total de lecturas
          </div>

          <div className="text-xl xl:text-2xl font-bold text-blue-600">
            {seriales.length}
          </div>

        </div>

      </div>


      {/* ESTADO DEL LECTOR */}

      <div className="mb-4 border rounded-lg p-3 xl:p-4 bg-gray-50">

        <div className="text-xs xl:text-sm text-gray-500 mb-1">
          Último serial leído
        </div>

        <div className="text-base xl:text-xl font-semibold font-mono break-all">

          {ultimoSerial !== ""
            ? ultimoSerial
            : "Esperando lectura..."
          }

        </div>

      </div>


      {/* TABLA */}

      <div
        className="ag-theme-quartz"
        style={{
          width: "100%",
          // Ocupa el alto disponible de la ventana (mínimo 250 px) en vez de 500 px fijos
          height: "calc(100vh - 300px)",
          minHeight: "250px",
          // Tamaños de la tabla
          "--ag-font-size": "12px",
          "--ag-header-font-size": "12px",
        } as React.CSSProperties}
      >

        <AgGridReact<SerialLeido>
          rowData={seriales}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true
          }}
          animateRows={true}
          suppressCellFocus={true}
          rowHeight={32}
          headerHeight={34}
        />

      </div>

    </div>

  )

}
