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
  - use_figma
---

# Token Sync

Sincronizacion bidireccional de design tokens entre Figma y codigo.
Tambien soporta flujo "design-only" para tokenizar archivos sin proyecto de codigo.

## Regla Critica

> La fuente de verdad de colores es SIEMPRE el diseno, NUNCA el codigo.
> Extraer los hex reales del archivo Figma. No inventar colores de paletas estandar.

## Flujo Design-Only (sin codigo)

Cuando el archivo Figma no tiene proyecto de codigo asociado, o se esta normalizando desde cero:

### Paso 1: Escanear colores reales del archivo

```javascript
// figma_execute: traverse ALL nodes, extract unique hex values with counts
const colorMap = {};
function toHex(c) { return `#${Math.round(c.r*255).toString(16).padStart(2,'0')}${Math.round(c.g*255).toString(16).padStart(2,'0')}${Math.round(c.b*255).toString(16).padStart(2,'0')}`.toUpperCase(); }
function scan(node) {
  if ('fills' in node && Array.isArray(node.fills)) {
    for (const f of node.fills) {
      if (f.type === 'SOLID' && f.color && f.visible !== false) {
        const hex = toHex(f.color);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
    }
  }
  if ('children' in node) node.children.forEach(scan);
}
figma.root.children.forEach(p => p.children.forEach(scan));
// Sort by count, return top colors
```

### Paso 2: Crear coleccion Primitives

Solo Light mode por defecto. Incluir TODOS los colores del archivo:
```
figma_setup_design_tokens({
  collectionName: "Primitives",
  modes: ["Default"],
  tokens: [/* uno por cada hex unico, agrupado por familia */]
})
```

Naming convention para Primitives:
- `color/black`, `color/white`
- `color/neutral/N` (grises ordenados de claro a oscuro)
- `color/blue/N`, `color/red/N`, `color/green/N` (por familia)
- `color/corpo/*` (colores corporativos)
- `color/brand/*` (colores de marca: gold, navy, etc.)

### Paso 3: Crear coleccion Semantic

Mapear colores por USO, no por valor:
```
figma_setup_design_tokens({
  collectionName: "Semantic",
  modes: ["Default"],
  tokens: [
    // Backgrounds
    { name: "color/bg/page", values: { Default: "#F0F0F0" } },
    { name: "color/bg/primary", values: { Default: "#FFFFFF" } },
    // Text
    { name: "color/text/primary", values: { Default: "#262626" } },
    // Borders, Actions, Feedback, Brand...
  ]
})
```

### Paso 4: Aplicar variables a todos los nodos (batch por pagina)

```javascript
// figma_execute (UNO POR PAGINA para evitar timeout de 30s)
// 1. Build hex → variable map (Semantic priority, then Primitives)
// 2. Traverse all nodes recursively
// 3. For each SOLID fill without existing binding:
//    setBoundVariableForPaint(fill, 'color', matchedVariable)
// 4. NUNCA cambiar el valor hex — solo vincular la variable
```

**CRITICO:** La apariencia visual NO debe cambiar. Cada hex se vincula a una variable con el MISMO valor hex.

### Paso 5: Revision post-aplicacion por componente

Despues del batch-apply, revisar visualmente CADA componente de la libreria local:
- Comparar con la copia de referencia del archivo fuente
- Buscar textos invisibles (texto del mismo color que el fondo)
- Buscar placeholders de imagen negros (fills tipo IMAGE, no solo SOLID)
- Un mismo hex puede tener usos correctos e incorrectos — el batch-apply no distingue contexto

### Paso 6: Verificar

Screenshot de 3+ pantallas. Deben verse IDENTICAS a antes de tokenizar.

## Errores Conocidos a Evitar

### 1. NUNCA usar colores del codigo como fuente de verdad
Los colores del codigo (Ant Design, Tailwind, etc.) pueden diferir del diseno.
Siempre escanear los hex reales del archivo Figma con `figma_execute`.

### 2. Mismo hex ≠ mismo significado semantico
Un color como `#364546` puede usarse para:
- Sidebar → correcto, es el color corpo
- Botones → correcto, es intencional
- Tabs inactivos → **error del diseno**, deberia ser transparente
- Labels de idioma → **error del diseno**, deberia ser gris

El batch-apply vincula TODOS los `#364546` a la misma variable.
Despues de aplicar, revisar componente por componente si el color es correcto en ese contexto.

### 3. Referencias huerfanas al borrar colecciones
Si se borran colecciones de variables, las bindings en los nodos **permanecen como referencias huerfanas**.
Figma renderiza esos nodos como **negro/oscuro**.
Solucion: SIEMPRE hacer undo en Figma en vez de borrar colecciones y re-crear.
Si hay que borrar: primero limpiar bindings de TODOS los nodos con `VariableID:XXX:*`.

### 4. Fills de tipo IMAGE no se detectan con scan de SOLID
El scan de colores solo detecta `f.type === 'SOLID'`.
Los placeholders de imagen usan `f.type === 'IMAGE'` y aparecen como cuadros negros.
Despues de tokenizar, buscar nodos con IMAGE fills > 50px y verificar si son placeholders.

### 5. Texto invisible en variantes hover
Si un boton hover tiene fondo oscuro y texto del mismo color → texto invisible.
Despues de tokenizar, verificar que las variantes hover/active de botones tengan contraste correcto.

### 6. Solo Light mode salvo indicacion explicita
NO crear Dark mode a menos que el diseno original lo tenga.
Dark mode agrega complejidad innecesaria y duplica el trabajo de verificacion.

## Aplicacion por Contexto (recomendado sobre batch-apply por hex)

El batch-apply por hex causa el error "mismo hex, diferente significado".
La aplicacion por contexto resuelve esto aplicando variables segun el ROL del nodo.

### Paso 1: Clasificar nodos por rol

```javascript
// figma_execute: traverse nodes, classify by name/structure/type
function classifyNode(node) {
  const name = node.name.toLowerCase();
  const parentName = node.parent?.name?.toLowerCase() || '';

  // Por nombre
  if (name.includes('sidebar') || name.includes('side bar')) return 'sidebar';
  if (name.includes('header') || name.includes('base bar')) return 'header';
  if (name.includes('divisor') || name.includes('divider')) return 'divider';
  if (name.includes('bg') || name.includes('background')) return 'background';
  if (name.includes('upload') || name.includes('image')) return 'placeholder';

  // Por tipo y estructura
  if (node.type === 'TEXT') {
    if (node.fontSize >= 20) return 'text-title';
    if (node.fontSize >= 14) return 'text-primary';
    return 'text-secondary';
  }

  // Por contexto del padre
  if (parentName.includes('tab') || parentName.includes('menu')) return 'navigation';
  if (parentName.includes('button') || parentName.includes('btn')) return 'button';

  // Frame principal (pantalla completa)
  if (node.type === 'FRAME' && node.width >= 1440) return 'page-frame';

  // Placeholder (rectangulo pequeno con fill oscuro)
  if ((node.type === 'RECTANGLE' || node.type === 'FRAME') &&
      node.width < 300 && node.height < 300) return 'possible-placeholder';

  return 'unclassified'; // → ira al batch-apply residual
}
```

### Paso 2: Aplicar variable segun rol

| Rol | Variable Semantica | Accion |
|-----|-------------------|--------|
| sidebar | `color/bg/sidebar` | Aplicar variable |
| header | `color/brand/corpo` | Aplicar variable |
| divider | `color/border/default` | Aplicar variable |
| background | `color/bg/primary` o `color/bg/elevated` | Aplicar segun brillo |
| placeholder | `color/neutral/placeholder` | Cambiar fill a gris #BFBFBF |
| text-title | `color/text/title` | Aplicar variable |
| text-primary | `color/text/primary` | Aplicar variable |
| text-secondary | `color/text/secondary` | Aplicar variable |
| navigation | **NO TOCAR** | Verificar manualmente |
| button | **NO TOCAR** | Los botones con fill oscuro son intencionales |
| page-frame | `color/bg/page` | Aplicar variable |
| possible-placeholder | **VERIFICAR** | Puede ser placeholder o elemento intencional |
| unclassified | Batch-apply por hex | Fallback al metodo clasico |

### Paso 3: Batch-apply RESIDUAL

Solo para nodos clasificados como `unclassified` en Paso 1.
Estos son los unicos que se aplican por hex match (metodo clasico).
Despues de esta fase, verificar manualmente los nodos afectados.

### Paso 4: Verificacion

Comparar cada componente con la copia de referencia.
Buscar: textos invisibles, placeholders negros, colores incorrectos.

---

## Flujo Bidireccional (con codigo)

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

## Extended Variable Collections (Theming) — Solo Enterprise

### Cuando usar

- El proyecto tiene multiples marcas (multi-brand / white-labeling)
- Se necesitan mas de 4 variaciones de tema (limite de modes en Professional)
- Se quiere herencia de tokens: un tema base + overrides por marca

### Concepto

Las Extended Collections permiten crear una coleccion hija que hereda TODOS los modes y variables de la coleccion padre. Solo se hace override de lo que cambia por tema.

```
Primitives (Library publicada, base)
├── Extended: "Brand A" → override color/brand/* con colores de Brand A
├── Extended: "Brand B" → override color/brand/* con colores de Brand B
└── Extended: "Brand C" → override color/brand/* con colores de Brand C
```

### Flujo

1. **Crear coleccion base** (Primitives + Semantic) siguiendo el flujo normal
2. **Publicar como Library** — REQUISITO: la base debe estar publicada para poder extenderla
3. **Extender por tema:**
   ```javascript
   // use_figma o figma_execute:
   const extension = await figma.variables.extendLibraryCollectionByKeyAsync(
     baseCollectionKey,  // key de la coleccion publicada
     "Brand A"           // nombre del tema
   );
   ```
4. **Override de variables por tema:**
   ```javascript
   // Leer valores actuales del tema:
   const values = await variable.valuesByModeForCollectionAsync(extension);
   // Modificar solo lo que cambia (ej: color/brand/primary)
   variable.setValueForMode(modeId, newValue);
   ```
5. **Remover override (volver al valor base):**
   ```javascript
   variable.removeOverrideForMode(extendedModeId);
   ```

### Propiedades utiles

- `extension.rootVariableCollectionId` — ID del ancestro raiz (top-most parent)
- `variable.valuesByModeForCollectionAsync(collection)` — valores resueltos incluyendo overrides

### Limitaciones

- **Solo plan Enterprise.** `extendLibraryCollectionByKeyAsync` lanza error en Professional/Free.
- La coleccion base DEBE ser una Library publicada.
- Las extensiones heredan modes — no se pueden agregar modes adicionales en la extension.

### Fallback sin Enterprise

Si el plan es Professional o inferior:
- Usar **modes dentro de una coleccion** (max 4 en Professional): ej. "Default", "Brand A", "Brand B", "Brand C"
- O crear **colecciones separadas** por tema (sin herencia automatica, requiere sync manual de cambios)

### Nota sobre canal de escritura

Si `use_figma` es el canal activo (no hay Desktop Bridge), las operaciones de `figma_setup_design_tokens` se traducen a:
```javascript
// use_figma equivalente:
const collection = figma.variables.createVariableCollection("Primitives");
const mode = collection.modes[0]; // ya tiene un mode por defecto
collection.renameMode(mode.modeId, "Default");
const variable = figma.variables.createVariable("color/brand/primary", collection, "COLOR");
variable.setValueForMode(mode.modeId, { r: 0.21, g: 0.27, b: 0.28, a: 1 });
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
