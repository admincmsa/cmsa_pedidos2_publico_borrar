// Contrato del QR del carrete: leerCodigo (src/bodega/carrete.ts) acepta y rechaza lo mismo
// que el backend (tests/qr_contrato.json de cmsa_pedidos_wh; copia en src/bodega/).
//
//     npm run test:qr        (Node 22.18 o más nuevo: lee el .ts sin compilar)

import { readFileSync } from "node:fs"
import { leerCodigo } from "../src/bodega/carrete.ts"

const { casos } = JSON.parse(readFileSync(new URL("../src/bodega/qr_contrato.json", import.meta.url), "utf8"))
let fallas = 0
for (const caso of casos) {
  const r = leerCodigo(caso.texto)
  const bien = r.ok === caso.ok &&
    (!r.ok || (r.lectura.serie === caso.serie && r.lectura.kilos === caso.kilos && r.lectura.awg === caso.awg))
  if (!bien) {
    fallas++
    console.log("FALLA", caso.nombre, JSON.stringify(r))
  }
}
console.log(`${casos.length - fallas} de ${casos.length} casos como el backend`)
process.exit(fallas ? 1 : 0)
