/**
 * Título de sección del sistema de diseño: cuadrado amarillo de 8 px y
 * versales espaciadas en azul («DATOS DEL CLIENTE»). Con `linea`, la regla
 * gris sigue hasta el borde, como en las secciones del documento.
 */
export default function TituloSeccion({
  children,
  linea = false,
  className = "",
}: {
  children: React.ReactNode
  linea?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span aria-hidden="true" className="h-2 w-2 flex-shrink-0 bg-cmsa-amarillo" />
      <span className="titulo-seccion">{children}</span>
      {linea && <span aria-hidden="true" className="h-px flex-1 bg-cmsa-borde" />}
    </div>
  )
}
