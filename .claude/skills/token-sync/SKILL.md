---
name: token-sync
description: Sincroniza tokens de diseno entre Figma variables y codigo (cualquier framework — Ant Design, Tailwind, Material UI, CSS custom properties, etc.). Usa cuando el usuario quiere actualizar tokens, sincronizar colores, tipografia, o spacing entre Figma y el codigo.
triggers:
  - "sincroniza tokens"
  - "actualiza colores"
  - "sync design tokens"
  - "tokens de figma a codigo"
  - "codigo a figma tokens"
  - "actualiza variables de figma"
tools:
  - figma_get_variables
  - figma_setup_design_tokens
  - figma_batch_create_variables
  - figma_batch_update_variables
  - figma_create_variable_collection
  - figma_browse_tokens
---

# Token Sync

Sincronizacion bidireccional de design tokens entre Figma y codigo.

## Discovery Phase

Before syncing, discover what exists on both sides:

### 1. Discover Figma Tokens

```
figma_get_variables({ format: "summary" })
```

Record: collections, modes (Light/Dark), token categories present.

### 2. Discover Code Tokens

Read project's CLAUDE.md to identify the UI framework, then locate token source:

| Framework | Token Source File |
|---|---|
| Tailwind CSS | `tailwind.config.ts` or `tailwind.config.js` |
| Ant Design | `src/theme/themeConfig.ts` or token config |
| Material UI | `src/theme/theme.ts` or `createTheme()` |
| Chakra UI | `src/theme/index.ts` or `extendTheme()` |
| Shadcn/ui | `globals.css` (CSS custom properties) |
| Custom CSS | `variables.css`, `tokens.css`, or similar |
| Style Dictionary | `tokens/` directory with JSON files |

### 3. Build Token Inventory

```markdown
| Category | Token Name | Figma Value | Code Value | Status |
|---|---|---|---|---|
| Color | primary | {figma} | {code} | Sync/Drift/Missing |
| Spacing | sm | {figma} | {code} | Sync/Drift/Missing |
```

## Common Token Categories to Check

| Category | Examples |
|---|---|
| Colors | primary, secondary, neutral scale, success, warning, danger |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 |
| Typography | font-family, font-sizes, font-weights, line-heights |
| Border Radius | sm, md, lg, full |
| Shadows | sm, md, lg, xl |
| Z-index | modal, dropdown, tooltip, overlay |
| Breakpoints | sm, md, lg, xl, 2xl |

## Proceso: Figma → Codigo

### Paso 1: Extraer tokens de Figma

```
figma_get_variables → lista completa de tokens
```

### Paso 2: Comparar con codigo

Leer el archivo de tema del proyecto:
- CMS: `src/theme/` o `tokens/` (Ant Design theme config)
- Tailwind projects: `tailwind.config.ts`

### Paso 3: Generar diff

```markdown
| Token | Figma | Codigo | Estado |
|---|---|---|---|
| Primary/6 | #1890FF | #1890FF | ✅ Sync |
| Neutral/3 | #F5F5F5 | #F0F0F0 | ⚠️ Drift |
| Header bg | — | #283544 | ❌ Solo en codigo |
| spacing/xl | 48px | — | ❌ Solo en Figma |
```

### Paso 4: Aplicar cambios

Segun direccion:
- **Figma es fuente de verdad**: Actualizar codigo
- **Codigo es fuente de verdad**: Actualizar Figma con `figma_batch_update_variables`

## Proceso: Codigo → Figma

### Paso 1: Leer tema del codigo

```javascript
// Para Ant Design (CMS)
import antTheme from 'src/theme/themeConfig';
// Extraer: colorPrimary, colorBgContainer, fontSize, borderRadius, etc.

// Para Tailwind
import tailwindConfig from 'tailwind.config.ts';
// Extraer: colors, spacing, fontFamily, fontSize, etc.
```

### Paso 2: Crear/actualizar colecciones en Figma

```
figma_setup_design_tokens({
  collectionName: 'CMS Tokens',
  modes: ['Light'],
  tokens: [
    { name: 'color/primary', resolvedType: 'COLOR', values: { Light: '#1890FF' } },
    { name: 'color/bg/content', resolvedType: 'COLOR', values: { Light: '#F5F5F5' } },
    { name: 'spacing/sm', resolvedType: 'FLOAT', values: { Light: 8 } },
    ...
  ]
})
```

### Paso 3: Aplicar tokens a componentes

Vincular variables de Figma a las propiedades de los componentes existentes.

## Estructura de colecciones recomendada

```
Figma Variable Collections:
├── Primitives (valores base)
│   ├── color/blue/50: #E6F7FF
│   ├── color/blue/500: #1890FF
│   ├── color/red/500: #FF4D4F
│   ├── color/green/500: #52C41A
│   ├── color/neutral/0: #FFFFFF
│   ├── color/neutral/50: #FAFAFA
│   ├── color/neutral/100: #F5F5F5
│   ├── color/neutral/200: #F0F0F0
│   ├── color/neutral/300: #D9D9D9
│   ├── color/neutral/600: #8C8C8C
│   ├── color/neutral/700: #595959
│   ├── color/neutral/900: #000000
│   ├── spacing/4: 4
│   ├── spacing/8: 8
│   ├── spacing/12: 12
│   ├── spacing/16: 16
│   ├── spacing/24: 24
│   ├── spacing/32: 32
│   ├── font/size/xs: 12
│   ├── font/size/sm: 14
│   ├── font/size/md: 16
│   ├── font/size/lg: 20
│   └── radius/sm: 2
│
├── Semantic (mapeo por uso)
│   ├── color/text/primary → color/neutral/700
│   ├── color/text/secondary → color/neutral/600
│   ├── color/text/disabled → color/neutral/300
│   ├── color/bg/page → color/neutral/100
│   ├── color/bg/card → color/neutral/0
│   ├── color/bg/header → #283544
│   ├── color/border/default → color/neutral/200
│   ├── color/action/primary → color/blue/500
│   ├── color/action/danger → color/red/500
│   ├── color/action/success → color/green/500
│   └── spacing/page-padding → spacing/24
│
└── Component (especificos de componente)
    ├── button/primary/bg → color/action/primary
    ├── button/primary/text → color/neutral/0
    ├── sidebar/width → 211
    ├── header/height → 56
    ├── table/row-height → 48
    └── modal/border-radius → radius/sm
```

## Output esperado

```
## Token Sync Report
- Direccion: {Figma→Codigo | Codigo→Figma}
- Fecha: {fecha}

## Resumen
- Tokens en sync: {N} ✅
- Tokens con drift: {N} ⚠️
- Tokens solo en Figma: {N}
- Tokens solo en codigo: {N}

## Cambios aplicados
| Token | Antes | Despues | Accion |
|---|---|---|---|
| ... | ... | ... | Creado/Actualizado/Eliminado |

## Tokens pendientes (requieren decision)
| Token | Figma | Codigo | Recomendacion |
|---|---|---|---|
| ... | ... | ... | ... |
```
