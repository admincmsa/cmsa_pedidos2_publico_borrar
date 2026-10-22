import LeerInventario from "../components/inventario/LeerInventario"

// El título y la ayuda los muestra el propio componente ("Lectura de Inventario")
export default function LeerInventarioPage() {
  return (
    <div className="p-4 xl:p-6">
      <LeerInventario />
    </div>
  )
}
