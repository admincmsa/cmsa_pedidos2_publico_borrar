/**
 * Colores del sistema de diseño CMSA v1 (julio 2026), en
 * «Unidades compartidas/DISEÑO/cmsa/CMSA Sistema de diseño».
 *
 * Los mismos valores están en tailwind.config.js como `cmsa-*`, para usarlos
 * en clases (`bg-cmsa-niebla`, `text-cmsa-gris`). Este módulo es para los
 * estilos en línea.
 */
export const CMSA = {
  /** Marca, bandas, títulos. */
  azul: "#1A0DBC",
  /** Franjas de cierre, hover. */
  azulProfundo: "#0E0776",
  /** Acentos: marcas, chips. Nunca como color de texto sobre blanco. */
  amarillo: "#F2DE3D",
  /** Texto principal. */
  tinta: "#171A3D",
  /** Texto secundario. */
  gris: "#5C607E",
  /** Paneles, fondo de la app, zebra de tablas. */
  niebla: "#EFF1FA",
  /** Líneas y divisores. */
  borde: "#D6DAF0",
  blanco: "#FFFFFF",
  /** Texto sobre el azul profundo (franja de pie). */
  sobreAzul: "#AEB2E0",
} as const

/**
 * El sistema de diseño no define colores de estado. Verde y rojo se usan solo
 * para «listo» y «error», que el operario tiene que distinguir de un vistazo.
 */
export const ESTADO = {
  ok: "#0E7A43",
  okFondo: "#DDF3E6",
  okTexto: "#0B5E34",
  errorFondo: "#FDE7E5",
  errorTexto: "#8A1B12",
} as const
