// Tipos ambientales para WebMCP (Web Model Context Protocol).
// Estándar propuesto W3C (Google + Microsoft), origin trial en Chrome 149+.
// No forma parte de lib.dom todavía, así que lo declaramos aquí.
//
// ⚠️ La API sigue evolucionando en el trial:
//   - `navigator.modelContext` quedó DEPRECADO en Chrome 150 → usar
//     `document.modelContext`. Declaramos ambos para máxima compatibilidad.
//   - La firma exacta de `registerTool` puede cambiar; el código que la usa
//     va envuelto en try/catch + feature-detection para no tumbar la app.
//
// Docs: https://developer.chrome.com/docs/ai/webmcp

import 'react';

// Los atributos de la API declarativa van en <form>/<input>/<select>/<textarea>.
// Sin esta augmentación, TS rechaza `toolname`/`toolparamdescription` en JSX.
declare module 'react' {
  interface HTMLAttributes<T> {
    /** <form>: nombre de la herramienta que expone este formulario a agentes IA. */
    toolname?: string;
    /** <form>: descripción de la acción que realiza la herramienta. */
    tooldescription?: string;
    /** Campo: descripción del parámetro dentro del JSON Schema generado. */
    toolparamdescription?: string;
    /** <form>: si está presente, el agente envía el formulario sin confirmación humana. */
    toolautosubmit?: boolean;
  }
}

declare global {
  interface WebMCPInputSchema {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  }

  interface WebMCPToolDefinition {
    name: string;
    description: string;
    inputSchema: WebMCPInputSchema;
    execute: (args: Record<string, unknown>) => string | Promise<string>;
  }

  interface WebMCPModelContext {
    registerTool(
      tool: WebMCPToolDefinition,
      options?: { signal?: AbortSignal }
    ): void | Promise<void>;
  }

  interface Document {
    readonly modelContext?: WebMCPModelContext;
  }

  interface Navigator {
    readonly modelContext?: WebMCPModelContext;
  }
}

export {};
