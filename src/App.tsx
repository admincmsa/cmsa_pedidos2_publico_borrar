/*
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import Layout from "./components/layout/Layout"

import LeerInventario from "./pages/LeerInventarioPage"
import Pedido from "./pages/PedidoPage"

function App() {

  return (

    <Router>

      <Layout>

        <Routes>


          <Route
            path="/leerinventario"
            element={<LeerInventario />}
          />
          <Route
            path="/pedido"
            element={<Pedido />}
          />
          


        </Routes>

      </Layout>

    </Router>

  )
}

export default App
*/



/*
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import PedidoComercialLista from "./components/pedidos/PedidoComercialLista"
import PedidoForm from "./components/pedidos/PedidoForm"
import PedidoBodegaLista from "./components/pedidos/PedidoBodegaLista"
import PedidoBodegaDetalle from "./components/pedidos/PedidoBodegaDetalle"
import Navbar from "./components/Navbar"

function Inicio() {
  const { usuario } = useAuth()
  if (usuario?.rol === "bodega") return <Navigate to="/bodega" replace />
  return <Navigate to="/comercial" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />

          <Route
            path="/comercial"
            element={
              <ProtectedRoute rolesPermitidos={["comercial", "admin"]}>
                <PedidoComercialLista />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comercial/nuevo"
            element={
              <ProtectedRoute rolesPermitidos={["comercial", "admin"]}>
                <PedidoForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bodega"
            element={
              <ProtectedRoute rolesPermitidos={["bodega", "admin"]}>
                <PedidoBodegaLista />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bodega/:pedidoId"
            element={
              <ProtectedRoute rolesPermitidos={["bodega", "admin"]}>
                <PedidoBodegaDetalle />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
*/


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import { Sidebar } from "./components/layout/Sidebar"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import PedidoComercialLista from "./components/pedidos/PedidoComercialLista"
import PedidoForm from "./components/pedidos/PedidoForm"
import PedidoBodegaLista from "./components/pedidos/PedidoBodegaLista"
import PedidoBodegaDetalle from "./components/pedidos/PedidoBodegaDetalle"

function Inicio() {
  const { usuario } = useAuth()
  if (usuario?.rol === "bodega") return <Navigate to="/bodega" replace />
  return <Navigate to="/dashboard" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-gray-50 min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout><Inicio /></Layout></ProtectedRoute>} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "comercial", "bodega"]}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/comercial"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "comercial"]}>
                <Layout><PedidoComercialLista /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/comercial/nuevo"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "comercial"]}>
                <Layout><PedidoForm /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bodega"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "bodega"]}>
                <Layout><PedidoBodegaLista /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bodega/:pedidoId"
            element={
              <ProtectedRoute rolesPermitidos={["admin", "bodega"]}>
                <Layout><PedidoBodegaDetalle /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}