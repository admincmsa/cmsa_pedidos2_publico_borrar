/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Sistema de diseño CMSA v1; los mismos valores en src/theme/cmsa.ts.
      colors: {
        cmsa: {
          azul: "#1A0DBC",
          "azul-profundo": "#0E0776",
          amarillo: "#F2DE3D",
          tinta: "#171A3D",
          gris: "#5C607E",
          niebla: "#EFF1FA",
          borde: "#D6DAF0",
          "sobre-azul": "#AEB2E0",
        },
      },
      // Archivo para todo: el sistema de diseño no usa una segunda fuente.
      fontFamily: {
        sans: ["Archivo", "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
}
