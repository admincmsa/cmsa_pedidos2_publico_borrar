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

export default function ReportCamaras() {

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
        Reporte por Cámara
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Ubicación</th>
            <th className="border p-2">NVR</th>
            <th className="border p-2">Cámara</th>
            <th className="border p-2">Tiempo Encendida</th>
            <th className="border p-2">Reinicios</th>
            <th className="border p-2">Porcentaje de horas<br />de Grabaciones</th>
            <th className="border p-2">Fecha más antigua<br />de Grabaciones</th>
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
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ1</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>7d 20:34:51</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>6</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>98.5%</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-04-03 10:20:04</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Guamo, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR Guamo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ2</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>7d 20:34:51</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>100.0%</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-04-01 14:02:54</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>3</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Numbana, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ3</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>3w 4d 12:20:01</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>1</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>85.1%</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>2026-05-23 20:44:59</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>4</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV Numbana, Tolima</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ4</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}></td>
            <td className="border p-2" style={{ textAlign: 'center'}}></td>
          </tr>
          {/*
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>5</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR La Martina</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PTZ</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}></td>
            <td className="border p-2" style={{ textAlign: 'center'}}></td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>6</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>PSFV La Martina, Cundinamarca</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>NVR La Martina</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Bala Garita</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}></td>
            <td className="border p-2" style={{ textAlign: 'center'}}></td>
          </tr>
          */}
        </tbody>
      </table>
    </div>
  )
}








