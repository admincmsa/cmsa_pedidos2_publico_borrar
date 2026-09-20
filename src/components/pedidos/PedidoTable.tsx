//import { useEffect, useState } from "react"
import { useState } from "react"
import api from "../../services/api"
import { formatDate } from "../../utils/date"
import type { Pedido } from "../../types/pedido";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react"
import type {ColDef} from "ag-grid-community";
import { AgGridReact, AgGridProvider } from "ag-grid-react";
import { themeQuartz,themeBalham } from "ag-grid-community";
import { AllCommunityModule } from 'ag-grid-community';
//import { useMemo } from "react";


interface PedidoTableProps {
  pedidos: Pedido[];
  loadPedidos: () => Promise<void>;
}


export default function PedidoTable({
  pedidos,
  loadPedidos
}: PedidoTableProps) {

  const [editing,setEditing] = useState<Pedido | null>(null)
  const [original,setOriginal] = useState<Pedido | null>(null)
  
  const deletePedido = async(id:number)=>{
    if(!confirm("Eliminar Pedido?")) return

    await api.put(`/pedido_eliminar/${id}`)
    loadPedidos()
  }
  
  const deactivatePedido = async(id:number)=>{
    await api.put(`/pedido_desactivar/${id}`)
    loadPedidos()
  }
  const activatePedido = async(id:number)=>{
    await api.put(`/pedido_activar/${id}`)
    loadPedidos()
  }
  const updatePedido = async(e:any)=>{
    e.preventDefault()
    if(!editing) return
    
    const changes = getChanges()
    if (Object.keys(changes).length === 0) {
      alert("No hay cambios")
      return
    }
    try {
      await api.patch(`/pedido_editar/${editing.id}`, changes)
      setEditing(null)
      loadPedidos()

    } catch (error) {
      console.error(error)
    }
  }
  // Detectar cambios en el formulario de edición
  const getChanges = () => {
    if (!editing || !original) return {}
    const changes: any = {}
    Object.keys(editing).forEach((key) => {
      if (editing[key as keyof Pedido] !== original[key as keyof Pedido]) {
        changes[key] = editing[key as keyof Pedido]
      }
    })
    return changes
  }

  const modules = [AllCommunityModule]
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: "header-center",
    wrapHeaderText:true,
    autoHeaderHeight:true,
    cellStyle: { display: 'flex', alignItems: 'center' }  
  }
  const myTheme = themeBalham
    .withParams({
      backgroundColor: '#ffffff',
      foregroundColor: '#070707',
      headerBackgroundColor: '#adacac47',
      headerTextColor: 'black',    
      spacing: 4,
      fontSize: 12,
      headerFontSize: 14,
      accentColor: '#b05fee',
    });
  const renderCentered = (value: any) => ( // Render para centrar las celdas
    <div
      style={{
        width: "100%",
        textAlign: "center",
      }}
    >
      {value}
    </div>
  );
  
  const columnDefs: ColDef<Pedido>[] = [
    { headerName: "Ítem",width: 70,pinned: "left",valueGetter: (params) =>(params.node?.rowIndex ?? 0) + 1,cellRenderer: (params: any) =>renderCentered((params.node?.rowIndex ?? 0) + 1)},//cellStyle: {textAlign: "center"}
    { field: "f430_ts",headerName: "Fecha", pinned: 'left',width: 120,},
    { field: "f430_consec_docto",headerName: "Pedido", pinned: 'left',width: 120,},
    { field: "f200_razon_social_pedido_fact",headerName: "Razón Social", pinned: 'left',width: 120,},
    { field: "f120_id",headerName: "F120_id", pinned: 'left',width: 180,},
    { field: "f120_referencia",headerName: "F120_ref", pinned: 'left',width: 120,},
    { field: "f120_descripcion",headerName: "Descripción",width: 120,},
    { field: "f431_precio_unitario_base",headerName: "Vlr Unit",width: 120,},
    { field: "f431_cant_pedida_base",headerName: "Cant Pedida", pinned: 'left',width: 120,},
    { field: "f431_vlr_bruto",headerName: "Vlr Total",width: 120,},
    { field: "f431_vlr_neto",headerName: "Vlr Total IVA",width: 160,},
    { field: "f431_notas",headerName: "Notas",width: 120,},
    {
      field: "activo",
      headerName: "Estado",
      width: 120,
      cellRenderer: (params: any) => {
        const activo = params.value;
        return (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: 600,
              color:
                activo ==true
                  ? "#16a34a"     // verde
                  : "#dc2626",    // rojo para inactivo u otros
            }}
          >
            {/*{params.value}*/}
            {activo === true ? "Activo" : "Inactivo"}
          </div>
        );
      },
    },
    {
      headerName: "Acciones",
      width: 160,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex justify-center gap-1 h-full items-center">
          {params.data.activo === false ? (
            
            <button
              title="Activar"
              className="p-1 rounded-lg text-green-600 hover:bg-green-100"
              onClick={() => activatePedido(params.data.id)}
            >
              <CheckCircle2 size={18} />
            </button>
          ) : (
            <button
              title="Desactivar"
              className="p-1 rounded-lg text-orange-600 hover:bg-orange-100"
              onClick={() => deactivatePedido(params.data.id)}
            >
              <XCircle size={18} />
            </button>
          )}
          
          <button
            title="Editar"
            className="p-1 rounded-lg text-blue-600 hover:bg-blue-100"
            onClick={() => {
              setEditing({ ...params.data });
              setOriginal({ ...params.data });
            }}
          >
            <Pencil size={18} />
          </button>
  
          <button
            title="Eliminar"
            className="p-1 rounded-lg text-red-600 hover:bg-red-100"
            onClick={() => deletePedido(params.data.id)}
          >
            <Trash2 size={18} />
          </button>
          
          
        </div>
      )
    }
  ]
  /*
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">
        Lista de Empleados
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Identificación</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Fecha Nacimiento</th>
            <th className="border p-2">Empresa</th>
            <th className="border p-2">Documentos</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((v, index)=>(
            <tr key={v.id}>
              <td className="border p-2" style={{ textAlign: 'center'}}>{index+1}</td>
              <td className="border p-2">{v.nombre}</td>
              <td className="border p-2">{v.numero_documento}</td>
              <td className="border p-2">{v.tipo_documento}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{formatDate(v.fecha_nacimiento)}</td>
              <td className="border p-2">{v.empresa}</td>
              <td className="border p-2">
                <div className="flex flex-col gap-1">
                  {v.documentos.map(doc => (
                    //<a key={doc.id} href={`http://127.0.0.1:5000/${doc.ruta}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{doc.archivo}</a>
                    
                    <a key={`${index+1}-${doc.id}`} href={`http://127.0.0.1:5000/${doc.ruta}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{doc.archivo}</a>
                    
                  ))
                  }
                </div>
              </td>
              <td className="border p-2" style={{ textAlign: 'center'}}>
                {v.activo==="SI"
                  ? <span className="text-green-600">Activo</span>
                  : <span className="text-red-600">Inactivo</span>
                }
              </td>
              <td className="border p-2 flex gap-2"> 
                <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>(setEditing(v),setOriginal(v))} >Editar</button>
                <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>deleteEmpleado(v.id)} >Eliminar</button>
                <button className="bg-gray-600 text-white px-2 py-1 rounded" onClick={()=>deactivateEmpleado(v.id)} >Desactivar</button>
                {
                  v.activo === "SI"
                    ? (
                      <button className="bg-gray-600 text-white px-2 py-1 rounded" onClick={()=>deactivateEmpleado(v.id)} >Desactivar</button>
                    )
                    : (
                      <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={()=>activateEmpleado(v.id)} >Activar</button>
                    )
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[400px] relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setEditing(null)}>✕</button>
            <form onSubmit={updateEmpleado} className="mt-6 space-y-3 border-t pt-4" >
              <h3 className="font-semibold">Editar Empleado</h3>
              <input placeholder="Nombre" className="border p-2 w-full" value={editing.nombre} onChange={(e)=>setEditing({...editing,nombre:e.target.value})} />
              <input placeholder="Identificación" className="border p-2 w-full" value={editing.numero_documento} onChange={(e)=>setEditing({...editing,numero_documento:e.target.value})}/>
              <input placeholder="Tipo Documento" className="border p-2 w-full" value={editing.tipo_documento} onChange={(e)=>setEditing({...editing,tipo_documento:e.target.value})}/>
              <input placeholder="Empresa" className="border p-2 w-full" value={editing.empresa} onChange={(e)=>setEditing({...editing,empresa:e.target.value})}/>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
  */
  return (
    
    <AgGridProvider modules={modules}>
      <div style={{ width:1500 }}>{/* height: 500, */}
      <AgGridReact<Pedido>
        theme={myTheme}
        // ... other props
        rowData={pedidos}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data.id.toString()}
        domLayout="autoHeight" // <- Propiedad clave
        //autoSizeStrategy={autoSizeStrategy}
        //skipHeaderOnAutoSize={true}
      />
      </div>
    </AgGridProvider>
   )
}