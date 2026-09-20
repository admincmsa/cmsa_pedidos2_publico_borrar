import { useState, useEffect } from "react"
import TicketForm from "../components/tickets/TicketForm1"
import SeguimientoForm from "../components/tickets/SeguimientoForm2"
import TicketTable from "../components/tickets/TicketTable"
import Modal from "../components/ui/Modal"
import api from "../services/api"
import type { Ticket } from "../types/ticket"
import SeguimientoHistorial from "../components/tickets/SeguimientoHistorial"

export default function TicketPage() {

  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([])

  const [ticketSeleccionado, setTicketSeleccionado] =
    useState<Ticket | null>(null)

  const [estados, setEstados] = useState<any[]>([])
  const [niveles, setNiveles] = useState<any[]>([])
  const [responsables, setResponsables] = useState<any[]>([])
  const [causasSoluciones, setCausasSoluciones] = useState<any[]>([])

  const [showHistorialModal, setShowHistorialModal] =
  useState(false)

const [ticketHistorial, setTicketHistorial] =
  useState<Ticket | null>(null)


  // ==================================================
  // CARGAR TICKETS
  // ==================================================

  const loadTickets = async () => {

    try {

      const res = await api.get("/ticket_listar")
      console.log(res.data)
      setTickets(res.data)

    } catch (error) {

      console.error(
        "Error cargando tickets:",
        error
      )

    }
  }


  // ==================================================
  // CARGAR ESTADOS
  // ==================================================

  const loadEstados = async () => {

    try {

      const res = await api.get(
        "/estado_listar_activos"
      )

      setEstados(
        res.data.map((item: any) => ({
          value: item.id,
          label: item.estado,
        }))
      )

    } catch (error) {

      console.error(
        "Error cargando estados:",
        error
      )

    }
  }


  // ==================================================
  // CARGAR NIVELES
  // ==================================================

  const loadNiveles = async () => {

    try {

      const res = await api.get(
        "/nivel_listar_activos"
      )

      setNiveles(
        res.data.map((item: any) => ({
          value: item.id,
          label: item.nivel,
        }))
      )

    } catch (error) {

      console.error(
        "Error cargando niveles:",
        error
      )

    }
  }


  // ==================================================
  // CARGAR RESPONSABLES
  // ==================================================

  const loadResponsables = async () => {

    try {

      const res = await api.get(
        "/responsable_listar_activos"
      )

      setResponsables(
        res.data.map((item: any) => ({
          value: item.id,
          label: item.tecnico,
        }))
      )

    } catch (error) {

      console.error(
        "Error cargando responsables:",
        error
      )

    }
  }


  // ==================================================
  // CARGAR CAUSAS Y SOLUCIONES
  // ==================================================

  const loadCausasSoluciones = async () => {

    try {

      const res = await api.get(
        "/causa_solucion_listar_activos"
      )

      setCausasSoluciones(
        res.data.map((item: any) => ({
          value: item.id,
          label: `${item.causa} — ${item.solucion}`,
        }))
      )

    } catch (error) {

      console.error(
        "Error cargando causas y soluciones:",
        error
      )

    }
  }


  // ==================================================
  // CARGAR DATOS INICIALES
  // ==================================================

  useEffect(() => {

    loadTickets()
    loadEstados()
    loadNiveles()
    loadResponsables()
    loadCausasSoluciones()

  }, [])


  // ==================================================
  // ABRIR SEGUIMIENTO
  // ==================================================

  const abrirSeguimiento = (ticket: Ticket) => {

    setTicketSeleccionado(ticket)

    setShowSeguimientoModal(true)

  }


  // ==================================================
  // CERRAR SEGUIMIENTO
  // ==================================================

  const cerrarSeguimiento = () => {

    setShowSeguimientoModal(false)

    setTicketSeleccionado(null)

  }

  const abrirHistorial = (ticket: Ticket) => {

  setTicketHistorial(ticket)

  setShowHistorialModal(true)
}

const cerrarHistorial = () => {

  setShowHistorialModal(false)

  setTicketHistorial(null)
}

  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        Tickets
      </h1>


      {/* ================================================= */}
      {/* CREAR TICKET */}
      {/* ================================================= */}

      <div className="flex gap-4 mb-6">

        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() =>
            setShowTicketModal(true)
          }
        >
          Crear Ticket
        </button>

      </div>


      {/* ================================================= */}
      {/* TABLA */}
      {/* ================================================= */}

      <TicketTable
        tickets={tickets}
        loadTickets={loadTickets}
        onSeguimiento={abrirSeguimiento}
        onHistorial={abrirHistorial}
      />


      <br />


      {/* ================================================= */}
      {/* MODAL CREAR TICKET */}
      {/* ================================================= */}

      <Modal
        isOpen={showTicketModal}
        onClose={() =>
          setShowTicketModal(false)
        }
        title="Crear Ticket"
      >

        <TicketForm
            onCreated={() => {
                setShowTicketModal(false)
                loadTickets()
            }}
            />

      </Modal>


      {/* ================================================= */}
      {/* MODAL SEGUIMIENTO */}
      {/* ================================================= */}

      <Modal
        isOpen={showSeguimientoModal}
        onClose={cerrarSeguimiento}
        title={
          ticketSeleccionado
            ? `Seguimiento - Ticket #${ticketSeleccionado.ticket}`
            : "Crear Seguimiento"
        }
      >

        {ticketSeleccionado && (

          <SeguimientoForm
            ticketId={ticketSeleccionado.id}
            estadoActualId={ticketSeleccionado.estado_id}
            nivelActualId={ticketSeleccionado.nivel_id}
            responsableActualId={ticketSeleccionado.responsable_id}
            estados={estados}
            niveles={niveles}
            responsables={responsables}
            causasSoluciones={causasSoluciones}
            onCreated={() => {
                cerrarSeguimiento()
                loadTickets()
            }}
            />

        )}

      </Modal>

      <Modal
        isOpen={showHistorialModal}
        onClose={cerrarHistorial}
        title={
            ticketHistorial
            ? `Historial - Ticket #${ticketHistorial.ticket}`
            : "Historial"
        }
        >
        {ticketHistorial && (
            <SeguimientoHistorial
            ticketId={ticketHistorial.id}
            />
        )}
        </Modal>

    </div>
  )
}