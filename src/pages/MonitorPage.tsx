/*
import {useEffect,useState} from "react"
type Item = {
  nombre: string;
  tipo: string;
  resultado: string;
  foto: string;
};


const datos: Item[] = [];

  // Generar datos dinámicamente con un loop for
  for (let i = 1; i <= 5; i++) {
    datos.push({
      nombre: `Nombre ${i}`,
      tipo: `Tipo ${i}`,
      resultado: `Resultado ${i}`,
      foto: `https://via.placeholder.com/50?text=Img+${i}`,
    });
  }

export default function MonitorPage(){
  const [logs,setLogs] = useState<any[]>([])
  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:5002")
    ws.onmessage = (event)=>{
      const data = JSON.parse(event.data)
      setLogs(prev=>[data,...prev])
    }
    return () => ws.close()
  },[])

  return(
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Monitor en Tiempo Real
      </h1>
      <table className="w-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Fecha y Hora</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Dato</th>
            <th className="border p-2">Resultado</th>
          </tr>
        </thead>
        <tbody>
          
          
          {datos.map((item, index) => (
          <tr key={index}>
            <td>{item.nombre}</td>
            <td>{item.tipo}</td>
            <td>{item.resultado}</td>
            <td>
              <img src={item.foto} alt={item.nombre} />
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  )
}
*/

/*
{logs.map((l,i)=>(
            <tr key={i}>
              <td className="border p-2" style={{ textAlign: 'center'}}>{l.fecha_hora_llegada_servidor}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{l.data.tipo}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{l.data.placa || l.data.nombre}</td>
              <td style={{ textAlign: 'center'}} className={`border p-2 font-bold ${
                //l.resultado?.includes("No Autorizado")
                l.data.resultado?.includes("No Autorizado")
                  ? "text-red-600"
                  : "text-green-600"
              }`}>{l.resultado}</td>
            </tr>
          ))}
*/






/*
// DEMO para mostrar datos en la página periódicos pero sin websocket, con variables internas en un for loop
import { useEffect, useState } from "react";

type Item = {
  fechahora: string;
  nombre: string;
  tipo: string;
  resultado: string;
  razon:string;
  //foto: string;
};

export default function Tabla() {
  const [datosVisibles, setDatosVisibles] = useState<Item[]>([]);

  const datos: Item[] = [];

  // Generar datos dinámicamente con un loop for

 for (let i: number = 1; i <= 5; i++) {
  datos.push({
      fechahora: `2026-03-24 09:10:00`,
      nombre: `Carlos Mejia`,
      tipo: `Facial`,
      resultado: `Autorizado`,
      razon:''
    });


    datos.push({
      fechahora: `2026-03-24 09:10:05`,
      nombre: `Santiago Cruz`,
      tipo: `Facial`,
      resultado: `No Autorizado`,
      razon:'No está registrado'
    });
    datos.push({
      fechahora: `2026-03-24 09:10:07`,
      nombre: `Alejandro Gonzalez`,
      tipo: `Facial`,
      resultado: `No Autorizado`,
      razon:'La Seguridad Social está vencida'
    });
    datos.push({
      fechahora: `2026-03-24 09:10:10`,
      nombre: `INO761`,
      tipo: `LPR`,
      resultado: `Autorizado`,
      razon:''
    });
    datos.push({
      fechahora: `2026-03-24 09:10:15`,
      nombre: `MME459`,
      tipo: `LPR`,
      resultado: `No Autorizado`,
      razon:'El SOAT está vencido'
    });
 }
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    datos.forEach((item, index) => {
      const timer = setTimeout(() => {
        setDatosVisibles((prev) => [...prev, item]);
      }, index * 5000); // 5 segundos entre cada fila

      timers.push(timer);
    });

    // Limpieza de timers
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Monitor en Tiempo Real
      </h1>

      <table className="w-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Fecha y Hora</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Dato</th>
            <th className="border p-2">Resultado</th>
            <th className="border p-2">Notas</th>
            <th className="border p-2">Foto</th>
          </tr>
        </thead>

        <tbody>
          {datosVisibles.map((item, index) => (
            <tr key={index}>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.fechahora}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.tipo}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.nombre}</td>
              
              
              <td style={{ textAlign: 'center'}} className={`border p-2 font-bold ${
                //l.resultado?.includes("No Autorizado")
                item.resultado?.includes("No Autorizado")
                  ? "text-red-600"
                  : "text-green-600"
              }`}>{item.resultado}</td>
              <td className="border p-2" style={{ textAlign: 'left'}}>{item.razon}</td>
              <td className="border p-2" style={{ textAlign: 'left'}}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
*/





/* 
// DEMO muestra todo lo que llega a través del websocket escrito en python test-monitorserver4.py
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface Mensaje {
  fecha: string;
  contenido: any;
}

const socket = io("http://localhost:5001");

export default function MonitorPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Conectado al servidor");
    });

    socket.on("nuevo_mensaje", (data: Mensaje) => {
      console.log("📩 Nuevo mensaje:", data);

      setMensajes((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("nuevo_mensaje");
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📡 Monitor en Tiempo Real</h2>

      <table style={{
        width: "80%",
        borderCollapse: "collapse",
        marginTop: "20px"
      }}>
        <thead>
          <tr>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Contenido</th>
          </tr>
        </thead>
        <tbody>
          {mensajes.map((msg, index) => (
            <tr key={index}>
              <td style={tdStyle}>{msg.fecha}</td>
              <td style={tdStyle}>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(msg.contenido, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  background: "#eee"
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  verticalAlign: "top"
};
*/


import { useEffect, useState } from "react";
import { io } from "socket.io-client";

//interface Mensaje {
//  fecha: string;
//  contenido: any;
//}

//type Item = {
interface Item {
  fechahora: string;
  nombre: string;
  tipo: string;
  resultado: string;
  notas:string;
  imagenes:string[];
  //foto: string;
};

const socket = io("http://localhost:5001");


export default function MonitorPage() {
  //const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [datosVisibles, setDatosVisibles] = useState<Item[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);  

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Conectado al servidor");
    });

    //socket.on("nuevo_mensaje", (data: Mensaje) => {
    socket.on("nuevo_mensaje", (data: Item) => {
      console.log("📩 Nuevo mensaje:", data);

      //setMensajes((prev) => [data, ...prev]);
      //setDatosVisibles((prev) => [...prev, item]);
      setDatosVisibles((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("nuevo_mensaje");
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Monitor en Tiempo Real
      </h1>

      <table className="w-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Fecha y Hora</th>
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Dato</th>
            <th className="border p-2">Resultado</th>
            <th className="border p-2">Notas</th>
            <th className="border p-2">Rutas</th>
            <th className="border p-2">Fotos</th>
          </tr>
        </thead>

        <tbody>
          {datosVisibles.map((item, index) => (
            <tr key={index}>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.fechahora}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.tipo}</td>
              <td className="border p-2" style={{ textAlign: 'center'}}>{item.nombre}</td>
              
              
              <td style={{ textAlign: 'center'}} className={`border p-2 font-bold ${
                //l.resultado?.includes("No Autorizado")
                item.resultado?.includes("No Autorizado")
                  ? "text-red-600"
                  : "text-green-600"
              }`}>{item.resultado}</td>
              <td className="border p-2" style={{ textAlign: 'left'}}>{item.notas}</td>
              <td className="border p-2" style={{ textAlign: 'left'}}>
                {item.imagenes.map((imagen, index) => (
                <div key={index}>
                  {imagen}
                </div>
              ))}
              </td>
              <td>
  <img src={`http://localhost:5000/fotoscamaras/${item.imagenes}`} style={{
        height: "80px",
        cursor: "pointer"
      }} />
</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 🖼️ 👇 AQUÍ VA EL MODAL (fuera de la tabla pero dentro del return) */}
      {imagenSeleccionada && (
        <div
          onClick={() => setImagenSeleccionada(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <img
            src={imagenSeleccionada}
            alt="preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%"
            }}
          />
        </div>
      )}
    </div>

  );
}
/*
const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  background: "#eee"
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  verticalAlign: "top"
};
*/






