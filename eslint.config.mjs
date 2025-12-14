// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], // archivos que se van a analizar

    // Extiende las reglas recomendadas por ESLint
    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest", // permite la sintaxis moderna (ES2023+)
      sourceType: "module", // soporta import/export
      globals: {
        ...globals.browser, // variables globales del navegador
        ...globals.node, // y también las de Node.js (útil si mezclas ambos)
      },
    },

    rules: {
      // --- 🔧 Reglas básicas de estilo ---
      semi: ["error", "always"], // requiere punto y coma
      quotes: ["error", "double"], // comillas dobles
      indent: [off], // indentación de 2 espacios
      "no-trailing-spaces": "warn", // sin espacios al final de línea

      // --- ⚠️ Buenas prácticas ---
      eqeqeq: ["warn", "always"], // usar === en lugar de ==
      "no-unused-vars": "off", // advierte variables no usadas
      "no-console": "off", // permite usar console.log
      "no-undef": "error", // marca variables no definidas
    },
  },
]);
