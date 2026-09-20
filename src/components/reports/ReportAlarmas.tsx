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

export default function ReportAlarmas() {

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
        Reporte de Alarmas
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Fecha y Hora</th>
            <th className="border p-2">Ubicación</th>
            <th className="border p-2">Tipo de Alarma</th>
            <th className="border p-2">Dispositivo Origen</th>
            <th className="border p-2">Descripción</th>
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
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-02 09:15:31</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Radar 1</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo 349m</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-02 09:17:14</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Radar 1</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo 231m</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>3</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-05 21:21:08</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Radar 2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona 231m</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>4</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-10 04:56:42</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Radar 2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Vehículo 393m</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>5</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-06 01:40:11</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Guamo, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ 1</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona, cruce de línea</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>6</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-13 23:02:29</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Guamo, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ 1</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona, cruce de línea</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>7</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-17 21:17:22</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Guamo, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ 2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Intrusión Persona, cruce de línea</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}








