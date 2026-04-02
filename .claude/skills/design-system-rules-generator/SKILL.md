---
name: design-system-rules-generator
description: "Genera reglas de design system para el proyecto que guian a agentes AI a producir codigo consistente con Figma. Guarda en CLAUDE.md, AGENTS.md, o .cursor/rules/. Usa cuando el usuario quiere configurar reglas de diseno para su proyecto."
triggers:
  - "genera reglas de design system"
  - "design system rules"
  - "configura las reglas de figma"
  - "create design rules"
  - "setup design system"
tools:
  - create_design_system_rules
  - get_variable_defs
  - get_metadata
  - search_design_system
---

# Design System Rules Generator

Genera reglas de design system personalizadas para el proyecto que guian a agentes AI a producir codigo consistente con los patrones de Figma.

## Cuando Usar

- Al adoptar FigmaSync en un proyecto nuevo
- Despues de normalizar un archivo Figma (`/normalization-pipeline`)
- Cuando el codigo generado no sigue las convenciones del design system
- Al cambiar de framework UI o actualizar el design system

## Proceso

### Paso 1: Generar reglas base

```
create_design_system_rules({
  clientLanguages: "typescript,html,css",
  clientFrameworks: "react,nextjs"
})
```

Ajustar `clientLanguages` y `clientFrameworks` segun el proyecto.

### Paso 2: Analizar el codebase

Leer el proyecto para entender:
- **Estructura de componentes:** `src/components/`, organizacion por feature o tipo
- **Styling approach:** Tailwind, CSS Modules, styled-components, etc.
- **Patrones existentes:** Como se crean componentes, que hooks usan, imports
- **Tokens en codigo:** tailwind.config.ts, theme.ts, variables.css
- **Nomenclatura:** PascalCase, kebab-case, convenciones de nombres

### Paso 3: Enriquecer con datos de Figma

Si hay un archivo Figma conectado:
```
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
search_design_system({ query: "button", fileKey: "{fileKey}" })
```

Extraer:
- Variables disponibles y su mapping a codigo
- Componentes publicados y sus propiedades
- Convenciones de naming en Figma

### Paso 4: Generar reglas personalizadas

Categorias de reglas a generar:

**Reglas de componentes:**
- Donde viven los componentes en el proyecto
- Como importarlos
- Patrones de props (required vs optional)
- Composicion (children, slots, render props)

**Reglas de estilos:**
- Framework CSS usado
- Como aplicar tokens (clases Tailwind, CSS variables, theme object)
- Breakpoints y responsive approach
- Spacing scale

**Reglas de Figma MCP:**
- Cuando usar `get_design_context` vs `get_metadata`
- Como interpretar Code Connect mappings
- Como respetar MCP usage instructions

**Reglas de assets:**
- Donde guardar imagenes, iconos, fonts
- Como referenciarlos en codigo
- Optimizacion (next/image, lazy loading)

### Paso 5: Guardar en el archivo correcto

| Agente | Archivo destino |
|--------|----------------|
| Claude Code | `CLAUDE.md` (seccion "Design System Rules") |
| Codex CLI | `AGENTS.md` |
| Cursor | `.cursor/rules/figma-design-system.mdc` |

Detectar que agente esta activo y guardar en el archivo correspondiente.

### Paso 6: Verificar

Pedir al usuario que pruebe generando codigo desde un frame de Figma. El codigo debe:
- Usar los componentes correctos del proyecto
- Aplicar tokens en vez de hardcodear valores
- Seguir la estructura y naming del proyecto

## Output Esperado

```markdown
## Design System Rules

### Components
- Location: src/components/ui/
- Import pattern: `import { Button } from '@/components/ui/Button'`
- Props: TypeScript interfaces, required props first

### Styling
- Framework: Tailwind CSS v4
- Tokens: Use design tokens via Tailwind classes
- Spacing: 4px grid (p-1=4px, p-2=8px, p-4=16px, p-6=24px)

### Figma Integration
- Always check Code Connect before generating
- Respect MCP usage instructions when present
- Use search_design_system before creating components

### Assets
- Images: public/images/, use next/image
- Icons: Use Lucide React icons
- Fonts: Inter (loaded via next/font)
```
