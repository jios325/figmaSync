---
name: design-system-rules-generator
description: "Genera reglas de design system en dos formatos: (1) reglas para agentes AI (CLAUDE.md/AGENTS.md/.cursor/rules) y (2) guidelines para Figma Make Kits (guidelines/*.md). Usa cuando el usuario quiere configurar reglas de diseno, crear un Make Kit, o generar guidelines para su design system."
triggers:
  - "genera reglas de design system"
  - "design system rules"
  - "configura las reglas de figma"
  - "create design rules"
  - "setup design system"
  - "make kit guidelines"
  - "genera guidelines para make"
  - "crea un make kit"
tools:
  - create_design_system_rules
  - get_variable_defs
  - get_metadata
  - search_design_system
  - get_code_connect_map
  - get_context_for_code_connect
  - use_figma
---

# Design System Rules Generator

Genera reglas de design system en dos formatos:
1. **Reglas para agentes AI** → CLAUDE.md / AGENTS.md / .cursor/rules
2. **Guidelines para Figma Make Kits** → carpeta `guidelines/` con markdown estructurado

## Casos de Uso (Prompts de Ejemplo)

### Generar reglas para agentes AI
```
/design-system-rules-generator genera reglas para el proyecto:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

### Generar guidelines para Make Kit
```
/design-system-rules-generator genera guidelines para Make Kit:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

### Generar ambos formatos
```
/design-system-rules-generator genera reglas y Make Kit guidelines:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

### Generar guidelines desde un proyecto con codigo
```
/design-system-rules-generator genera Make Kit guidelines para:
Figma: https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
Codigo: src/components/
```

---

## Formato 1: Reglas para Agentes AI

### Proceso

#### Paso 1: Generar reglas base
```
create_design_system_rules({
  clientLanguages: "typescript,html,css",
  clientFrameworks: "react,nextjs"
})
```

#### Paso 2: Analizar el codebase
Leer el proyecto para entender:
- Estructura de componentes (`src/components/`)
- Styling approach (Tailwind, CSS Modules, styled-components)
- Patrones existentes (hooks, imports, composicion)
- Tokens en codigo (tailwind.config.ts, theme.ts, variables.css)

#### Paso 3: Enriquecer con datos de Figma
```
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
search_design_system({ query: "button", fileKey: "{fileKey}" })
```

#### Paso 4: Guardar en el archivo correcto

| Agente | Archivo destino |
|--------|----------------|
| Claude Code | `CLAUDE.md` (seccion "Design System Rules") |
| Codex CLI | `AGENTS.md` |
| Cursor | `.cursor/rules/figma-design-system.mdc` |

---

## Formato 2: Guidelines para Figma Make Kits

### Que es un Make Kit

Un Make Kit empaqueta tu design system para que **Figma Make** (el AI app builder) genere prototipos usando tus componentes reales. Tiene 3 pilares:
- **Code context:** npm package con React components
- **Style context:** Variables y estilos importados de Figma
- **Guidelines:** Markdown que ensena al AI como usar el sistema

Este skill genera el tercer pilar: las **guidelines**.

### Proceso

#### Paso 1: Escanear el design system

```
get_metadata(nodeId: "{pageId}", fileKey: "{fileKey}")
search_design_system({ query: "button card input", fileKey: "{fileKey}" })
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
```

Inventariar:
- Todos los componentes con sus nombres y propiedades
- Todas las variables (colores, spacing, tipografia, radius)
- Estilos de texto y efecto

#### Paso 2: Obtener propiedades de cada componente

Para los componentes principales:
```
get_context_for_code_connect(nodeId: "{componentId}", fileKey: "{fileKey}")
```

Extraer: variant properties, text properties, boolean properties, instance swap properties.

#### Paso 3: Leer el codigo (si hay proyecto asociado)

Si el usuario proporciona un codebase:
- Leer `src/components/` para identificar props, variantes, imports
- Leer `tailwind.config.ts` o archivo de tokens
- Leer archivos de tema (ThemeProvider, CSS variables)

#### Paso 4: Generar la estructura de guidelines

Crear la carpeta `guidelines/` con esta estructura:

```
guidelines/
├── Guidelines.md              ← Entry point: filosofia + reglas globales
├── setup.md                   ← Imports, providers, configuracion tecnica
├── components/
│   ├── overview.md            ← Catalogo de todos los componentes
│   ├── button.md              ← Guia por componente
│   ├── input.md
│   ├── card.md
│   └── [componente].md
├── foundations/
│   ├── overview.md            ← Intro al sistema de tokens
│   ├── color.md               ← Paleta, tokens, decision trees
│   ├── spacing.md             ← Escala de spacing
│   ├── typography.md          ← Type ramp, pesos, clases
│   └── modes.md               ← Light/Dark (si aplica)
└── composition/
    ├── overview.md            ← Patrones de layout
    ├── layout.md              ← Grid, containers, responsive
    └── surfaces.md            ← Cards, modals, overlays
```

#### Paso 5: Escribir cada archivo siguiendo el formato Make Kit

---

### Formato de cada archivo

#### `Guidelines.md` (entry point)

```markdown
# [Nombre del Design System]

## Product Character
- [B2B/B2C/Internal]
- Visual density: [compact/relaxed/balanced]
- Color strategy: ~90% neutral surfaces, brand color for primary actions only
- Corner radius: [sharp/rounded/pill]
- Typography: [font family] with [N]-step type ramp

## Reading Order
1. Read this file first for global rules
2. Read setup.md for technical configuration
3. Read foundations/ for tokens and visual language
4. Read components/overview.md before using any component
5. Read components/[name].md BEFORE using that specific component

## Global Rules
- ALWAYS use design tokens — never hardcode colors, spacing, or font sizes
- ALWAYS check components/overview.md before building custom UI
- NEVER skip the component guideline file before using a component
- ONLY ONE primary button per visible section
- Navigation hierarchy: [describe your nav levels]
```

#### `components/overview.md`

```markdown
# Component Catalog

| Component | Purpose | Import | Guideline |
|-----------|---------|--------|-----------|
| Button | Primary actions, CTAs | `import { Button } from '@/components'` | [button.md](button.md) |
| Input | Text entry fields | `import { Input } from '@/components'` | [input.md](input.md) |
| Card | Content containers | `import { Card } from '@/components'` | [card.md](card.md) |

## Alternative Names
- "CTA" → use Button with variant="primary"
- "Text field" → use Input
- "Container" → use Card or Surface
```

#### `components/button.md` (ejemplo por componente)

```markdown
# Button

## When to Use
- User-initiated actions (submit, save, delete)
- Navigation CTAs
- NOT for links (use Link component instead)

## Variants

| Variant | When to use |
|---------|-------------|
| `primary` | Main CTA — only ONE per visible section |
| `secondary` | Supporting actions alongside a primary |
| `ghost` | Low-emphasis actions, toolbars |
| `danger` | Destructive actions (delete, remove) |

Valid variants: `"primary"`, `"secondary"`, `"ghost"`, `"danger"` — nothing else.

## Decision Tree
```
Main CTA of the section?
├── YES → variant="primary"
└── NO → Supporting action next to primary?
    ├── YES → variant="secondary"
    └── NO → Low emphasis?
        ├── YES → variant="ghost"
        └── NO → Destructive?
            ├── YES → variant="danger"
            └── NO → variant="secondary" (default)
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "ghost" \| "danger"` | `"secondary"` | Visual style |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| disabled | `boolean` | `false` | Disabled state |
| iconStart | `ReactNode` | — | Icon before label |
| iconEnd | `ReactNode` | — | Icon after label |

## Examples

CORRECT:
```jsx
<Button variant="primary" size="md">Save Changes</Button>
<Button variant="secondary" iconStart={<PlusIcon />}>Add Item</Button>
```

WRONG:
```jsx
<Button variant="blue">Save</Button>        // "blue" is not a valid variant
<Button leftIcon={<Icon />}>Add</Button>     // use iconStart, not leftIcon
```

## Rules
- NEVER use more than one primary button in the same visible area
- ALWAYS provide a text label (icon-only buttons need aria-label)
- Danger buttons MUST have a confirmation dialog for destructive actions
```

#### `foundations/color.md` (ejemplo de tokens)

```markdown
# Color System

## Palette Overview

| Role | Token | Tailwind Class | Usage |
|------|-------|---------------|-------|
| Page background | `--color-bg-page` | `bg-page` | Main canvas |
| Surface | `--color-bg-surface` | `bg-surface` | Cards, panels |
| Primary action | `--color-action-primary` | `bg-primary` | Buttons, links |
| Text primary | `--color-text-primary` | `text-primary` | Body text |
| Text secondary | `--color-text-secondary` | `text-secondary` | Captions, hints |
| Border | `--color-border-default` | `border-default` | Dividers, inputs |
| Error | `--color-feedback-error` | `text-error` | Validation |
| Success | `--color-feedback-success` | `text-success` | Confirmations |

## Naming Pattern
`--color-{category}-{role}`
Categories: `bg`, `text`, `border`, `action`, `feedback`

## Decision Tree — Background Color
```
Page canvas? → bg-page
├── Elevated content? → bg-surface
│   ├── Input field? → bg-input
│   └── Hover state? → bg-surface-hover
├── Brand section? → bg-primary (sparingly)
└── Status? → bg-success / bg-warning / bg-error
```

## Rules
- NEVER hardcode hex colors — always use tokens
- Brand color covers ~10% of the UI, neutral ~90%
- NEVER use primary color as large area background
```

#### `foundations/typography.md`

```markdown
# Typography

## Font Families
- **Primary:** Inter — UI text, body, labels
- **Headings:** Inter Semi Bold — titles, section headers

## Type Scale

| Class | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-display` | 32px | Semi Bold | 40px | Page titles |
| `text-heading` | 24px | Semi Bold | 32px | Section headings |
| `text-title` | 20px | Semi Bold | 28px | Card titles |
| `text-body` | 16px | Regular | 24px | Body text |
| `text-caption` | 14px | Regular | 20px | Labels, hints |
| `text-small` | 12px | Regular | 16px | Badges, tags |

## Rules
- ALWAYS use composite type classes — never set font-size directly
- NEVER use text-small for anything except captions and badges
- Headings: Semi Bold. Body: Regular. NEVER use Bold for body text
```

#### `setup.md`

```markdown
# Technical Setup

## Required Imports
```css
/* In your main CSS file */
@import '@/styles/tokens.css';
@import '@/styles/globals.css';
```

## Provider Setup
```tsx
// In your app root
import { ThemeProvider } from '@/components/ThemeProvider';

export default function App({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

## Rules
- NEVER import component CSS individually — use the global import
- NEVER override token values inline — use the token system
```

---

### Reglas para Escribir Guidelines de Make Kit

1. **Muchos archivos cortos** > pocos archivos largos — evita saturar el contexto del AI
2. **Lenguaje imperativo:** "NEVER use", "ALWAYS check" — no "consider using"
3. **Decision trees** en cada componente y cada categoria de tokens
4. **Variantes explicitas:** listar TODAS las opciones validas — "nothing else"
5. **Ejemplos CORRECT y WRONG** para cada componente
6. **Overview files** que ruteen al AI a los archivos especificos
7. **Props tables** con tipo, default, y descripcion

---

## Integracion con Otros Skills

| Skill | Datos que aporta |
|-------|-----------------|
| `/design-normalizer` | Score del archivo, inventario de componentes |
| `/token-sync` | Variables, colecciones, valores por mode |
| `/code-connect-bridge` | Mapeo componente Figma → componente codigo, props |
| `/figma-quality-gate` | Validacion de naming, tokens, consistencia |
| `/design-system-health` | Metricas de uso, coverage, adoption |
