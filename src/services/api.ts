/*
import axios from "axios"

const api = axios.create({
  //baseURL:"http://localhost:5006"
  //baseURL:"http://192.168.35.248:5006"//Portatil Paola en ITC Wifi
  //baseURL:"http://192.168.35.248:5007"//Portatil Paola en Casa CM LAN
  baseURL:"http://10.81.2.12:5007"//Srv desde el PC de desarrollo hacia el srv
  //baseURL:"/api"//Srv produccion, Nota el orden importante en el location /api/: al tener la barra final en proxy_pass http://10.81.2.12:5007/;, nginx quita el prefijo /api/ antes de reenviar — así http://cmsapedidos.isashiia.com/api/login llega al backend como http://10.81.2.12:5007/login

})


// Adjunta el token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expira o es inválido, cierra sesión y manda a login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("usuario")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)


export default api
*/
import axios from "axios"

const api = axios.create({
  //baseURL:"http://localhost:5006"
  //baseURL:"http://192.168.35.248:5006"//Portatil Paola en ITC Wifi
  //baseURL:"http://192.168.35.248:5007"//Portatil Paola en Casa CM LAN
  baseURL: import.meta.env.VITE_API_URL || "http://10.81.2.12:5007",//Srv desde el PC de desarrollo hacia el srv
  //baseURL:"/api"//Srv produccion, Nota el orden importante en el location /api/: al tener la barra final en proxy_pass http://10.81.2.12:5007/;, nginx quita el prefijo /api/ antes de reenviar — así http://cmsapedidos.isashiia.com/api/login llega al backend como http://10.81.2.12:5007/login

})


// Adjunta el token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expira o es inválido, cierra sesión y manda a login.
// El 401 de /login es una clave equivocada, no una sesión vencida: si también
// recargara la página, el formulario perdería el mensaje de error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esIngreso = String(error?.config?.url ?? "").endsWith("/login")
    if (error?.response?.status === 401 && !esIngreso) {
      localStorage.removeItem("token")
      localStorage.removeItem("usuario")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)


// Mensaje legible de un error del backend (incluye la lista de errores de Siesa)
export function mensajeError(err: unknown, porDefecto: string): string {
  const e = err as { response?: { data?: { error?: string; errores?: string[] } }; message?: string } | null
  const data = e?.response?.data
  if (data?.errores?.length && !data?.error) return data.errores.join("\n")
  return data?.error || e?.message || porDefecto
}

export default api