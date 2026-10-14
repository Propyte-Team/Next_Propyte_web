import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow `_`-prefix to mark intentionally unused vars/args
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // a11y: enforce alt text on <img>, <area>, <input type="image">, <object>.
      // Empty string alt="" is intentional (decorative) and passes.
      "jsx-a11y/alt-text": "warn",
      // React Compiler rules (eslint-config-next 16): marcan patrones legítimos
      // como setState-en-effect para hidratar de localStorage, o factories de
      // componentes en libs de UI. Las dejamos como warn (visibilidad sin
      // bloquear CI) en vez de error. Revisar caso por caso si crece la lista.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      // Fuentes: siempre next/font/local con los .woff2 de src/fonts/.
      // next/font/google las descarga de Google en CADA build del VPS y una
      // respuesta rara tumba el deploy (2026-10-14, URL de fuente sin extensión).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/font/google",
              message:
                "Usa next/font/local con un .woff2 de src/fonts/. Para añadir una familia o un peso: scripts/descargar-fuentes.mjs.",
            },
          ],
        },
      ],
    },
  },
  {
    // Scripts de QA/test/build (no shippeados, Node CommonJS): no aplican las
    // reglas de app code (require() es válido en scripts .js de Node).
    files: ["tests/**", "scripts/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
