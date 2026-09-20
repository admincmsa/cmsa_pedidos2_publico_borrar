export interface Pedido {
  id: number
  f430_ts: string
  f430_consec_docto: number
  f200_razon_social_pedido_fact: string
  f120_id: string
  f120_referencia: string
  f120_descripcion: string
  f431_precio_unitario_base: number
  f431_cant_pedida_base: number
  f431_vlr_bruto: number
  f431_vlr_neto: number
  f431_notas: string
  activo: boolean
}