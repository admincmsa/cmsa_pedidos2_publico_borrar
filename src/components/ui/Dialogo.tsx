import Boton from "./Boton"

/**
 * Confirmación propia. El `confirm()` del navegador no se ve en la tablet y
 * en algunos navegadores ni aparece; esta se lee a un metro y se toca con el
 * dedo. `peligro` pinta el botón de confirmar en rojo (quitar, eliminar).
 */
export default function Dialogo({
  titulo,
  detalle,
  confirmar,
  peligro = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: {
  titulo: string
  detalle?: string
  confirmar: string
  peligro?: boolean
  /** Mientras se ejecuta la acción: el botón se deshabilita y no se puede cerrar. */
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogo-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-cmsa-tinta/50 px-6"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="dialogo-titulo" className="text-2xl font-bold text-cmsa-tinta">
          {titulo}
        </h2>
        {detalle && <p className="mt-2 text-lg text-cmsa-gris">{detalle}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Boton variante="secundario" onClick={onCancelar} disabled={ocupado} className="h-14 text-lg">
            Cancelar
          </Boton>
          <Boton
            variante={peligro ? "peligro" : "primario"}
            onClick={onConfirmar}
            disabled={ocupado}
            autoFocus
            className="h-14 text-lg"
          >
            {ocupado ? "Un momento…" : confirmar}
          </Boton>
        </div>
      </div>
    </div>
  )
}
