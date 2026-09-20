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

export default function ReportControlAcceso() {

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
        Reporte de Control de Acceso
      </h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Ítem</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Ubicación</th>
            <th className="border p-2">Terminal</th>
            <th className="border p-2">Tiempo Encendido</th>
            <th className="border p-2">Reinicios</th>
            <th className="border p-2">Accesos<br />Válidos/Inválidos</th>
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
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Guamo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 1 Garita</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>3w 3d 15:07:38</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>150 / 21</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 3 Cuarto </td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0 / 0</td>
          </tr>
          {/*
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>2</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Guamo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 2 Almacén</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>3w 2d 02:23:21</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>32 / 4</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>3</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Guamo</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 3 Cuarto Control</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>3w 2d 05:20:54</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>210 / 11</td>
          </tr>
          
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>4</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 1 Garita</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0 / 0</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>5</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 2 Almacén</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0 / 0</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>6</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'red'}}>Offline</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Tolima, PSFV Numbana</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 3 Cuarto </td>
            <td className="border p-2" style={{ textAlign: 'center'}}>00:00:00</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0 / 0</td>
          </tr>
          <tr>
            <td className="border p-2" style={{ textAlign: 'center'}}>7</td>
            <td className="border p-2" style={{ textAlign: 'center',color:'green'}}>Online</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Cundinamarca, PSFV La Martina</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>Facial 1 Garita</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0w 2d 23:09:33</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>0</td>
            <td className="border p-2" style={{ textAlign: 'center'}}>54 / 39</td>
          </tr>
          */}
        </tbody>
      </table>
    </div>
  )
}








