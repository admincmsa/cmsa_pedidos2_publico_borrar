import { useState, useEffect } from "react"
import PedidoForm from "../components/pedidos/PedidoForm1"
import PedidoTable from "../components/pedidos/PedidoTable"
import Modal from "../components/ui/Modal"
import api from "../services/api"
import type { Pedido } from "../types/pedido"
//import SeguimientoHistorial from "../components/tickets/SeguimientoHistorial"

export default function PedidoPage() {

  const [showPedidoModal, setShowPedidoModal] = useState(false)
  
  const [pedidos, setPedidos] = useState<Pedido[]>([])





  // ==================================================
  // CARGAR Pedidos
  // ==================================================

  const loadPedidos = async () => {

    try {
      console.log("aca")
      const res = await api.get("/pedidos_listar_activos")
      console.log(res.data)
      setPedidos(res.data)

    } catch (error) {

      console.error(
        "Error cargando pedidos:",
        error
      )

    }
  }

  // ==================================================
  // CARGAR DATOS INICIALES
  // ==================================================

  useEffect(() => {

    loadPedidos()

  }, [])
  
  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        Pedidos
      </h1>


      {/* ================================================= */}
      {/* CREAR PEDIDO */}
      {/* ================================================= */}

      <div className="flex gap-4 mb-6">

        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() =>
            setShowPedidoModal(true)
          }
        >
          Cargar Pedido
        </button>

      </div>


      {/* ================================================= */}
      {/* TABLA */}
      {/* ================================================= */}

      <PedidoTable
        pedidos={pedidos}
        loadPedidos={loadPedidos}

      />


      <br />


      {/* ================================================= */}
      {/* MODAL CARGAR PEDIDO */}
      {/* ================================================= */}
      
      <Modal
        isOpen={showPedidoModal}
        onClose={() =>
          setShowPedidoModal(false)
        }
        title="Crear Equipo Servicio"
      >

        <PedidoForm
            onCreated={() => {
                setShowPedidoModal(false)
                loadPedidos()
            }}
            />

      </Modal>
      *



    </div>
  )
}