/**
 * Lectura del carrete de alambre esmaltado: QR, calibre e ítem de Siesa.
 *
 * El QR que imprime IRCE y que entrega la pistola Zebra:
 *
 *     Q11.22#S34193108#L126200036105#P#
 *
 *     Q<peso en kg>          peso real del carrete
 *     S<serie>               8 dígitos: orden de producción (5) + carrete (3)
 *     L<código del proveedor> 12 dígitos: línea (6) + diámetro (4) + carrete (2)
 *
 * El diámetro va en milésimas de milímetro y da el calibre AWG; el calibre da
 * el ítem de Siesa. Esta lógica es la misma de `siesa_codigos.py` en el
 * backend (rama fix/calibres-diametro-irce): el calibre se calcula con la
 * fórmula AWG y se toma el más cercano, porque IRCE imprime su diámetro real,
 * que en 16 de los 30 calibres difiere una micra del teórico (AWG 13: 1829,
 * teórico 1828).
 *
 * Aquí se usa para una sola cosa: saber a qué línea del pedido va el carrete
 * que acaba de leer el operario. Quien decide si la lectura es válida sigue
 * siendo el backend.
 */

export const AWG_MIN = 8
export const AWG_MAX = 37

/** Entre calibres vecinos hay ~12 %; IRCE se aparta menos de 0,5 %. */
export const TOLERANCIA_DIAMETRO_PCT = 3

/** Peso aceptable de un carrete, en kg. Fuera de ahí la lectura está dañada. */
export const PESO_MIN = 0
export const PESO_MAX = 100

/** Diámetro nominal AWG en mm: 0,127 · 92^((36 − AWG) / 39). */
export function diametroTeoricoMm(awg: number): number {
  return 0.127 * Math.pow(92, (36 - awg) / 39)
}

/** Calibre AWG más cercano al diámetro en milésimas de mm, o null. */
export function awgPorDiametro(milesimas: number): number | null {
  if (!Number.isFinite(milesimas) || milesimas <= 0) return null
  const mm = milesimas / 1000
  const awg = Math.round(36 - 39 * (Math.log(mm / 0.127) / Math.log(92)))
  if (awg < AWG_MIN || awg > AWG_MAX) return null
  const teorico = diametroTeoricoMm(awg)
  const desvio = (Math.abs(mm - teorico) / teorico) * 100
  return desvio <= TOLERANCIA_DIAMETRO_PCT ? awg : null
}

/** Calibres cuyo ítem no sigue la numeración 2103–2131. */
const ITEM_ESPECIAL: Record<number, string> = { 37: "2341" }

/** AWG → ítem de Siesa (AWG 8 = 2103 … AWG 36 = 2131). */
export function itemDeAwg(awg: number): string | null {
  if (ITEM_ESPECIAL[awg]) return ITEM_ESPECIAL[awg]
  if (awg < AWG_MIN || awg > 36) return null
  return String(2095 + awg)
}

/** Ítem de Siesa → AWG. */
export function awgDeItem(item: string | number | null | undefined): number | null {
  const id = String(item ?? "").trim()
  if (!id) return null
  if (id === "2341") return 37
  const n = Number(id)
  if (!Number.isInteger(n) || n < 2103 || n > 2131) return null
  return n - 2095
}

/** La app de bodega solo separa alambre esmaltado de cobre. */
export function esCobre(item: string | number | null | undefined): boolean {
  return awgDeItem(item) !== null
}

/**
 * Rango de peso del carrete, leído de la descripción del ítem:
 * «ALAMBRE ESMALTADO COBRE 20 (18-20 KG)» → { min: 18, max: 20 }.
 *
 * El mínimo es lo que decide cuándo un calibre queda listo: si falta menos que
 * el carrete más liviano, ya no cabe otro y la línea se despacha así.
 */
export function rangoCarrete(descripcion: string | null | undefined): { min: number; max: number } {
  const m = String(descripcion ?? "").match(/\((\d+)\s*-\s*(\d+)\s*KG\)/i)
  if (!m) return { min: 10, max: 45 }
  return { min: Number(m[1]), max: Number(m[2]) }
}

/** Kilos como los escribe el operario: 12,37 kg. */
export function kg(n: number): string {
  return Number(n || 0).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

export interface Lectura {
  /** Serie del carrete, 8 dígitos. Es el lote en Siesa. */
  serie: string
  /** Peso del QR, o null cuando el operario escribió solo la serie. */
  kilos: number | null
  /** Código del proveedor del QR (campo L), o null. */
  codigo: string | null
  /** Calibre deducido del código, o null si la serie se escribió a mano. */
  awg: number | null
  /** true cuando el QR estaba dañado y el operario escribió los 8 dígitos. */
  manual: boolean
  /** El texto tal como lo entregó la pistola, para mandarlo al backend. */
  texto: string
}

export type ResultadoLectura =
  | { ok: true; lectura: Lectura }
  | { ok: false; titulo: string; detalle: string }

/** ¿El texto del campo ya es una lectura completa? */
export function esLecturaCompleta(texto: string): boolean {
  const t = String(texto ?? "").trim()
  return /#P#$/i.test(t) || /^\d{8}$/.test(t)
}

/**
 * Interpreta lo que llegó al campo de escaneo.
 *
 * Rechaza, con el mismo criterio del backend: dos QR pegados, una serie que no
 * tiene 8 dígitos, un peso fuera de rango y un texto sin `#` (pasa cuando el
 * teclado de la tablet está en otro idioma y la pistola escribe otra cosa).
 */
export function leerCodigo(texto: string): ResultadoLectura {
  const t = String(texto ?? "").trim()
  if (!t) return { ok: false, titulo: "No se leyó nada", detalle: "Escanee el carrete otra vez." }

  // El operario escribió la serie porque el QR está dañado.
  if (/^\d+$/.test(t)) {
    if (t.length !== 8) {
      return {
        ok: false,
        titulo: "Número de carrete inválido",
        detalle: `Son 8 dígitos: orden de producción (5) + número de carrete (3), por ejemplo 36763002. Escribió ${t.length}.`,
      }
    }
    return { ok: true, lectura: { serie: t, kilos: null, codigo: null, awg: null, manual: true, texto: t } }
  }

  if (!t.includes("#")) {
    return {
      ok: false,
      titulo: "No se pudo leer el QR",
      detalle: "La lectura llegó sin separadores. Revise que el teclado de la tablet esté en español y escanee otra vez.",
    }
  }

  if ((t.match(/#S/g) || []).length > 1) {
    return {
      ok: false,
      titulo: "Se leyeron dos carretes juntos",
      detalle: "Escanee un solo carrete y espere a que aparezca en la lista.",
    }
  }

  const m = t.match(/Q([\d.,]+)#S(\d+)#L([0-9A-Za-z]+)#/i)
  if (!m) {
    return { ok: false, titulo: "No se pudo leer el QR", detalle: "Escanee otra vez, apuntando a la etiqueta completa." }
  }

  const serie = m[2]
  if (serie.length !== 8) {
    return {
      ok: false,
      titulo: "La serie del QR no tiene 8 dígitos",
      detalle: `El QR trae ${serie || "nada"}. Escanee otra vez o escriba los 8 dígitos del carrete.`,
    }
  }

  const kilos = parseFloat(m[1].replace(",", "."))
  if (!Number.isFinite(kilos) || kilos <= PESO_MIN || kilos > PESO_MAX) {
    return {
      ok: false,
      titulo: "El peso del QR no es válido",
      detalle: `La lectura dice ${m[1]} kg. Escanee otra vez o escriba los 8 dígitos del carrete.`,
    }
  }

  const codigo = m[3]
  const awg = codigo.length >= 10 ? awgPorDiametro(Number(codigo.slice(6, 10))) : null

  return { ok: true, lectura: { serie, kilos, codigo, awg, manual: false, texto: t } }
}

/*
 * Despacho aproximado: se busca quedar lo más cerca posible de lo pedido, por
 * arriba o por abajo. La pantalla no pone tope (excesoKg = Infinity): bodega
 * agrega lo que tiene y el cliente aprueba la diferencia. El tope real lo pone
 * Siesa con el % de exceso que tenía el cliente al crear el pedido.
 */

/** "acerca": el carrete entra · "aleja": queda más lejos de lo pedido · "pasa_tope": se pasa más de lo aceptado. */
export type Encaje = "acerca" | "aleja" | "pasa_tope"

export function encaje(pedido: number, separado: number, kilos: number, excesoKg: number): Encaje {
  const nuevo = separado + kilos
  if (nuevo > pedido + excesoKg + 0.005) return "pasa_tope"
  return Math.abs(pedido - nuevo) < Math.abs(pedido - separado) - 0.005 ? "acerca" : "aleja"
}

/** La línea está lista cuando ni el carrete más liviano de su calibre la acercaría más a lo pedido. */
export function lineaLista(pedido: number, separado: number, minCarrete: number, excesoKg: number): boolean {
  return encaje(pedido, separado, minCarrete, excesoKg) !== "acerca"
}
