import { useEffect, useState } from "react"
import api from "../../services/api"

interface Vehicle {
  id: number
  placa: string
  marca: string
  modelo: string
  ano: number
  tipo: string
  empresa: string
  activo: string
  documentos: Documento[]
}
interface Documento {
  id: number
  archivo: string
  ruta: string
}

export default function VehicleTable() {

  const [vehicles,setVehicles] = useState<Vehicle[]>([])
  const [editing,setEditing] = useState<Vehicle | null>(null)
  const [original,setOriginal] = useState<Vehicle | null>(null)

  useEffect(()=>{
    loadVehicles()
  },[])

  const loadVehicles = async ()=>{
    const res = await api.get("/vehiculos")
    setVehicles(res.data)
  }


  const deleteVehicle = async(id:number)=>{
    if(!confirm("Eliminar vehículo?")) return

    await api.put(`/vehiculo_eliminar/${id}`)
    /*
    await fetch("http://127.0.0.1:5000/vehiculo/${id}", {
      method: "POST",
      body: formData,
    });
    */
    loadVehicles()
  }
  /*
  const deactivateVehicle = async(id:number)=>{
    await api.put(`/vehicles/${id}/deactivate`)
    loadVehicles()
  }
  */
  const updateVehicle = async(e:any)=>{
    e.preventDefault()
    if(!editing) return
    /*
    await api.put(`/vehiculo_editar/${editing.id}`,editing)
    setEditing(null)
    loadVehicles()
    */
    const changes = getChanges()
    if (Object.keys(changes).length === 0) {
      alert("No hay cambios")
      return
    }
    try {
      await api.patch(`/vehiculo_editar/${editing.id}`, changes)
      setEditing(null)
      loadVehicles()

    } catch (error) {
      console.error(error)
    }
  }
  // Detectar cambios en el formulario de edición
  const getChanges = () => {
    if (!editing || !original) return {}
    const changes: any = {}
    Object.keys(editing).forEach((key) => {
      if (editing[key as keyof Vehicle] !== original[key as keyof Vehicle]) {
        changes[key] = editing[key as keyof Vehicle]
      }
    })
    return changes
  }
  // 

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">
        Lista de Vehículos
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Placa</th>
            <th className="border p-2">Marca</th>
            <th className="border p-2">Modelo</th>
            <th className="border p-2">Año</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Empresa</th>
            <th className="border p-2">Documentos</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v)=>(
            <tr key={v.id}>
              <td className="border p-2" style={{ textAlign: 'center'}}>{v.id}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{v.placa}</td>
              <td className="border p-2">{v.marca}</td>
              <td className="border p-2">{v.modelo}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{v.ano}</td>
              <td className="border p-2">{v.tipo}</td>
              <td className="border p-2">{v.empresa}</td>
              <td className="border p-2">
                <div className="flex flex-col gap-1">
                  {v.documentos.map(doc => (
                    <a key={doc.id} href={`http://127.0.0.1:5000/${doc.ruta}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{doc.archivo}</a>
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
                <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>deleteVehicle(v.id)} >Eliminar</button>
             {/*<button className="bg-gray-600 text-white px-2 py-1 rounded" onClick={()=>deactivateVehicle(v.id)} >Desactivar</button>*/}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FORMULARIO EDICIÓN */}
      {/*
      {editing && (
        <form onSubmit={updateVehicle} className="mt-6 space-y-3 border-t pt-4">
          <h3 className="font-semibold">Editar Vehículo</h3>
          <input className="border p-2 w-full" value={editing.marca} onChange={(e)=>setEditing({...editing,marca:e.target.value})}/>
          <input className="border p-2 w-full" value={editing.modelo} onChange={(e)=>setEditing({...editing,modelo:e.target.value})}/>
          <input className="border p-2 w-full" value={editing.empresa} onChange={(e)=>setEditing({...editing,empresa:e.target.value})}/>
          <button className="bg-gray-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
        </form>
      )}
      */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[400px] relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setEditing(null)}>✕</button>
            <h3 className="font-semibold">Editar Vehículo</h3>
            <form onSubmit={updateVehicle} className="mt-6 space-y-3 border-t pt-4">
              <input placeholder="Marca" className="border p-2 w-full" value={editing.marca} onChange={(e)=>setEditing({...editing,marca:e.target.value})}/>
              <input placeholder="Modelo" className="border p-2 w-full" value={editing.modelo} onChange={(e)=>setEditing({...editing,modelo:e.target.value})}/>
              <input placeholder="Año" className="border p-2 w-full" value={editing.ano} onChange={(e)=>setEditing({...editing,ano:Number(e.target.value)})}/>
              <input placeholder="Año" className="border p-2 w-full" value={editing.empresa} onChange={(e)=>setEditing({...editing,empresa:e.target.value})}/>
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
}








