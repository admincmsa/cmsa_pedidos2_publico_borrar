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

export default function ReportNVRTable() {

  const [vehicles,setVehicles] = useState<Vehicle[]>([])


  useEffect(()=>{
    loadVehicles()
  },[])

  const loadVehicles = async ()=>{
    const res = await api.get("/vehiculos")
    setVehicles(res.data)
  }





  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">
        Reporte por NVR
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Ubicación</th>
            <th className="border p-2">NVR</th>
            <th className="border p-2">Tiempo Encendida</th>
            <th className="border p-2">Reinicios</th>
            <th className="border p-2">Estado de Discos Duros</th>
            <th className="border p-2">Temperatura</th>
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

            </tr>
          ))}
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>1</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Guamo, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR Guamo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>1w 4d 15h:09m:31s</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>15</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal 34°C</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Numbana, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>3w 6d 1h:18m:56s</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal 32°C</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>3</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR La Martina</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0w 6d 1h:23m:01s</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Normal 37°C</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}








