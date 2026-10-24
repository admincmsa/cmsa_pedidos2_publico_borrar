import { ESTADO } from "../../theme/cmsa"

/**
 * Aviso en la propia pantalla, en lugar del `alert()` del navegador, que en
 * la tablet aparece en letra pequeña y sin contexto. Verde para lo que salió
 * bien, rojo para lo que falló, amarillo para advertir.
 */
export type TipoAviso = "ok" | "error" | "alerta"

const COLOR: Record<TipoAviso, { background: string; color: string }> = {
  ok: { background: ESTADO.okFondo, color: ESTADO.okTexto },
  error: { background: ESTADO.errorFondo, color: ESTADO.errorTexto },
  alerta: { background: ESTADO.alertaFondo, color: ESTADO.alertaTexto },
}

export default function Aviso({
  tipo,
  titulo,
  detalle,
  grande = false,
  onCerrar,
  className = "",
}: {
  tipo: TipoAviso
  titulo: string
  detalle?: string | null
  /** En la tablet de bodega: título de 24 px. */
  grande?: boolean
  onCerrar?: () => void
  className?: string
}) {
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 ${className}`}
      style={COLOR[tipo]}
    >
      <div className="min-w-0 flex-1">
        <div className={`font-bold ${grande ? "text-2xl" : "text-base"}`}>{titulo}</div>
        {detalle && <div className={`whitespace-pre-line ${grande ? "text-lg" : "text-[15px]"}`}>{detalle}</div>}
      </div>
      {onCerrar && (
        <button
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xl font-bold hover:bg-black/5"
        >
          ×
        </button>
      )}
    </div>
  )
}
