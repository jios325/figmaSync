---
description: "Establece y mantiene mapeos Code Connect entre componentes de Figma y componentes de codigo. Usa cuando el usuario quiere mapear, conectar, o vincular componentes de Figma con codigo."
---

# Code Connect Bridge — Mapeo Figma ↔ Codigo

## Rol

Estableces y mantienes el puente entre componentes de Figma y componentes del codigo.
Code Connect es lo que hace que `get_design_context` retorne codigo que usa los
componentes reales del proyecto en lugar de codigo generico.

## Proceso de Setup Inicial

### Paso 1: Escanear Archivo Figma

```
get_metadata(nodeId: "0:1", fileKey: "{fileKey}")
```

Del XML retornado, identificar nodos que son componentes (reutilizables).
Crear lista con nombre y nodeId de cada componente.

### Paso 2: Auto-detectar Mapeos

Para cada componente (o para un nodo padre que los contenga):
```
get_code_connect_suggestions(nodeId: "{nodeId}", fileKey: "{fileKey}", {
  clientLanguages: "typescript,html,css",
  clientFrameworks: "react,nextjs"
})
```

Registrar las sugerencias con su nivel de confianza.

### Paso 3: Complementar con GitNexus

Para componentes sin sugerencia o con baja confianza:
```
gitnexus_query({query: "{NombreComponente}"})
```

Si se encuentra un candidato:
```
gitnexus_context({name: "{CandidatoEncontrado}"})
```

Verificar:
- Es un componente React exportado?
- Que props acepta?
- En que paginas se usa?
- Tiene variantes o wrappers?

### Paso 4: Presentar Tabla al Usuario

Mostrar tabla con todas las sugerencias:

```
| # | Figma Component | nodeId | Codigo Sugerido | Confianza |
|---|---|---|---|---|
| 1 | Button | 234:567 | src/components/ui/Button/index.tsx | Alta |
| 2 | HotelCard | 345:678 | src/components/ui/card/HotelCard.tsx | Alta |
| 3 | NavItem | 456:789 | src/components/layout/Navigation.tsx | Media |
| 4 | Hero | 567:890 | No encontrado | - |
```

Pedir al usuario que confirme, ajuste, o descarte cada mapeo.

### Paso 5: Guardar Mapeos Confirmados

```
send_code_connect_mappings({
  nodeId: "{nodeIdRaiz}",
  fileKey: "{fileKey}",
  mappings: [
    {
      nodeId: "234:567",
      componentName: "Button",
      source: "src/components/ui/Button/index.tsx",
      label: "React"
    },
    {
      nodeId: "345:678",
      componentName: "HotelCard",
      source: "src/components/ui/card/HotelCard.tsx",
      label: "React"
    }
  ]
})
```

### Paso 6: Verificar

```
get_code_connect_map(nodeId: "{nodeId}", fileKey: "{fileKey}")
```

Confirmar que retorna los mapeos guardados.

## Proceso de Mantenimiento

### Verificar Mapeos Existentes

1. Obtener mapeos actuales con `get_code_connect_map`
2. Para cada mapeo, verificar que el archivo source existe en el repo
3. Si GitNexus esta disponible, verificar con `gitnexus_context` que el simbolo existe
4. Reportar mapeos rotos

### Agregar Mapeo Individual

Para un componente nuevo:
```
add_code_connect_map({
  nodeId: "{nodeId}",
  fileKey: "{fileKey}",
  source: "src/components/ui/NuevoComponente.tsx",
  componentName: "NuevoComponente",
  label: "React"
})
```

### Mapeo Avanzado con Templates

Para componentes con variantes complejas, usar el parametro `template`:

```
add_code_connect_map({
  nodeId: "{nodeId}",
  fileKey: "{fileKey}",
  source: "src/components/ui/Button/index.tsx",
  componentName: "Button",
  label: "React",
  template: `<Button variant={figma.enum("Variant", {"Primary": "primary", "Secondary": "secondary"})} size={figma.enum("Size", {"Small": "sm", "Large": "lg"})}>{figma.string("Label")}</Button>`,
  templateDataJson: "{\"isParserless\": true, \"imports\": [\"import { Button } from '@/components/ui/Button'\"]}"
})
```

## Code Connect UI Nativa (2025-2026) — Organization/Enterprise

### Que cambio

Code Connect ahora tiene una **UI nativa** integrada en Figma:
- **Conexion directa a GitHub:** Se conecta el repo y Figma accede al codigo fuente
- **AI Suggestions:** Figma sugiere automaticamente que archivo de codigo mapear a cada componente
- **Snippets auto-generados:** Genera codigo de ejemplo basado en los archivos fuente reales
- **MCP usage instructions:** Nuevo campo de texto que dice a LLMs como usar el componente

### MCP Usage Instructions

Cuando `get_design_context` retorna un componente con **MCP usage instructions**, estas instrucciones DEBEN RESPETARSE al generar codigo. Contienen:
- Props requeridos vs opcionales
- Patrones de uso comunes
- Restricciones (ej: "no usar size='xl' en mobile")
- Import path correcto

### Como se complementan

| Tarea | UI Nativa (Figma) | Nuestro MCP Flow |
|-------|-------------------|------------------|
| Setup inicial (visual) | Ideal — UI facil para disenadores | Alternativa via CLI |
| Bulk mapping (50+ components) | Lento (uno por uno) | Ideal — `send_code_connect_mappings` batch |
| Mantenimiento automatico | Manual | Automatizable via scheduled tasks |
| Detectar mapeos rotos | No notifica | `get_code_connect_map` + verificar archivos |
| Escribir MCP usage instructions | Via UI | Via `add_code_connect_map` con template |

**Recomendacion:** Usar UI nativa para el setup visual inicial (mas facil para el equipo de diseno). Usar nuestro MCP flow para automatizacion, mantenimiento bulk, y deteccion de mapeos rotos.

### Escribir MCP Usage Instructions

Al crear mappings avanzados con templates, agregar MCP usage instructions que incluyan:

```
add_code_connect_map({
  nodeId: "{nodeId}",
  fileKey: "{fileKey}",
  source: "src/components/ui/Button/index.tsx",
  componentName: "Button",
  label: "React",
  template: `<Button variant={figma.enum("Variant", {...})}>{figma.string("Label")}</Button>`,
  templateDataJson: JSON.stringify({
    isParserless: true,
    imports: ["import { Button } from '@/components/ui/Button'"],
    // MCP usage instructions se definen en el template como comentario o metadata
  })
})
```

Las MCP usage instructions deben incluir:
1. **Required props:** Que props son obligatorios
2. **Common patterns:** Patrones de uso mas frecuentes
3. **Restrictions:** Que NO hacer (ej: no combinar variant="ghost" con size="xl")
4. **Import path:** Path exacto de importacion

## Labels por Framework

| Framework | Label | Notas |
|---|---|---|
| Next.js / React | "React" | Para proyectos React/Next.js |
| Vue / Nuxt | "Vue" | Para proyectos Vue |
| Svelte / SvelteKit | "Svelte" | Para proyectos Svelte |
| iOS | "SwiftUI" o "Swift" | Segun el framework |
| Android | "Compose" o "Kotlin" | Segun el framework |
| Flutter | "Flutter" | Cross-platform |
| Vanilla | "Javascript" | Sin framework |

## Templates Parserless Avanzados (API Completa)

### Paso Adicional: Obtener Propiedades del Componente

Antes de crear un template avanzado, obtener las propiedades del componente con:
```
get_context_for_code_connect(nodeId: "{componentNodeId}", fileKey: "{fileKey}")
```
Retorna: property definitions con tipos, variant options, y arbol de descendientes.

### API de Template

#### Propiedades de Instancia
```javascript
// Texto
instance.getString("Label")                    // Retorna valor de TEXT property

// Booleano
instance.getBoolean("Show Icon")               // Retorna true/false

// Enum (variants)
instance.getEnum("Size", {                     // Mapea valores Figma → codigo
  "Small": "sm",
  "Medium": "md",
  "Large": "lg"
})

// Instance Swap
instance.getInstanceSwap("Icon")               // Retorna componente swapped
```

#### Descendants (componentes anidados)
```javascript
// Buscar instancia anidada por nombre
instance.findInstance("Avatar")                // Encuentra child instance "Avatar"

// Buscar texto anidado
instance.findText("Title")                     // Encuentra child text "Title"

// Buscar instancia con Code Connect
instance.findConnectedInstance("Badge")        // Solo si Badge tiene Code Connect

// Ejecutar template de componente anidado
const badge = instance.findConnectedInstance("Badge");
if (badge && badge.hasCodeConnect()) {
  badge.executeTemplate()                      // Genera el codigo del componente anidado
}
```

#### Tagged Templates
```javascript
// React/JSX
figma.tsx`<Button variant={instance.getEnum("Variant", {...})}>{instance.getString("Label")}</Button>`

// HTML
figma.html`<button class="${instance.getEnum("Size", {...})}">${instance.getString("Label")}</button>`

// Kotlin (Compose)
figma.kotlin`Button(text = ${instance.getString("Label")})`
```

#### Ejemplo Completo de .figma.js
```javascript
// Button.figma.js
import figma from "@figma/code-connect";

figma.connect("https://figma.com/design/FILE_KEY/FILE?node-id=NODE_ID", {
  props: {
    label: figma.string("Label"),
    variant: figma.enum("Variant", {
      "Primary": "primary",
      "Secondary": "secondary",
      "Ghost": "ghost"
    }),
    size: figma.enum("Size", {
      "Small": "sm",
      "Medium": "md",
      "Large": "lg"
    }),
    disabled: figma.boolean("Disabled"),
    icon: figma.instance("Leading Icon")
  },
  example: (props) => (
    <Button
      variant={props.variant}
      size={props.size}
      disabled={props.disabled}
    >
      {props.icon}
      {props.label}
    </Button>
  )
});
```

### Reglas Criticas para Templates
1. **NUNCA** concatenar strings con resultados de template — usar tagged templates
2. **SIEMPRE** verificar `hasCodeConnect()` antes de `executeTemplate()`
3. **SIEMPRE** verificar `type === 'INSTANCE'` antes de `hasCodeConnect()`
4. Los archivos `.figma.js` son alternativa a `add_code_connect_map` para templates complejos

## Metricas

Despues de cada sesion de mapeo, reportar:

```
Code Connect Coverage
=====================
Total componentes Figma: {N}
Mapeados: {N} ({X}%)
Sin mapeo (necesitan): {N}
Sin mapeo (decorativos): {N}
Mapeos rotos: {N}
```

## Regla Critica

**SIEMPRE verificar Code Connect antes de generar codigo desde Figma.**
La calidad del codigo generado por `get_design_context` depende directamente
de la calidad y cobertura de los mapeos Code Connect.
