import { useEffect, useRef } from "react"

/**
 * Vuelve a cargar una lista sola, sin botón «Actualizar»: cada `cadaMs`
 * mientras la pestaña está a la vista, y en cuanto la tablet o el navegador
 * vuelven a mostrarla (cambio de pestaña, pantalla que se enciende).
 *
 * `cargar` recibe `true` en los refrescos automáticos, para que la pantalla no
 * muestre «Cargando…» ni borre lo que ya tiene mientras llega la respuesta.
 */
export function useRefrescoAutomatico(cargar: (silencioso: boolean) => unknown, cadaMs = 20000) {
  const ultimo = useRef(cargar)
  ultimo.current = cargar

  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === "visible") ultimo.current(true)
    }
    const intervalo = window.setInterval(refrescar, cadaMs)
    document.addEventListener("visibilitychange", refrescar)
    window.addEventListener("focus", refrescar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener("visibilitychange", refrescar)
      window.removeEventListener("focus", refrescar)
    }
  }, [cadaMs])
}
