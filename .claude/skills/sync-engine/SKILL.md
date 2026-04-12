---
name: sync-engine
description: "Motor de sincronizacion incremental bidireccional Figma <-> Codigo. Detecta que cambio (delta), muestra diff al usuario, y aplica solo los cambios necesarios en la direccion elegida. No recaptura ni regenera todo. Usa cuando el usuario dice 'sincroniza', 'actualiza el diseño', 'pasa estos cambios a figma/codigo', o 'que esta desincronizado'."
triggers:
  - "sincroniza"
  - "sync"
  - "actualiza el diseño"
  - "pasa los cambios a figma"
  - "pasa los cambios al codigo"
  - "que cambio en figma"
  - "que esta desincronizado"
  - "aplica los cambios de figma"
  - "refleja en figma"
  - "refleja en codigo"
  - "sync incremental"
tools:
  - get_design_context
  - get_metadata
  - get_screenshot
  - get_variable_defs
  - get_code_connect_map
  - use_figma
  - generate_figma_design
  - search_design_system
  - preview_start
  - preview_screenshot
  - preview_eval
---

# Sync Engine — Sincronizacion Incremental Bidireccional

## Concepto

Este skill NO recaptura ni regenera todo. Detecta el **delta** (que cambio) y
aplica solo los cambios necesarios en la direccion que el usuario elija.

```
                    ┌────────────────┐
                    │  Sync Engine   │
                    │  (este skill)  │
                    └───────┬────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │   Figma → Code   │        │   Code → Figma   │
    │                  │        │                  │
    │ • Tokens (vars)  │        │ • Tokens (CSS)   │
    │ • Layout (props) │        │ • Contenido      │
    │ • Contenido      │        │ • Nuevas secciones│
    │ • Nuevos frames  │        │ • Layout changes │
    └──────────────────┘        └──────────────────┘
```

## Limitacion tecnica

El Figma MCP **no tiene webhooks ni eventos**. No puede "escuchar" cambios en
tiempo real. El sync siempre es **on-demand**: el usuario pide "sincroniza" y
el engine compara el estado actual de ambos lados.

## Pre-requisitos

1. **Figma Remote MCP** conectado
2. **fileKey** del archivo Figma (URL o guardado en config)
3. **Dev server** corriendo (para comparar screenshots)
4. **Cargar `/figma-use`** antes de cualquier escritura a Figma

## Flujo principal

### Paso 1: Detectar direccion

Preguntar al usuario o inferir del contexto:

| El usuario dice... | Direccion |
|---------------------|-----------|
| "pasa estos cambios a figma" | Code → Figma |
| "aplica el diseño de figma" | Figma → Code |
| "sincroniza" / "sync" | Detectar automaticamente (Paso 2) |
| "que esta desincronizado" | Solo reportar (no aplicar) |

### Paso 2: Detectar delta (que cambio)

Ejecutar estas comparaciones en paralelo:

#### 2a. Delta de tokens
```
1. Leer variables de Figma:
   get_variable_defs(nodeId: "0:1", fileKey)

2. Leer tokens del codigo:
   - Tailwind: leer globals.css o tailwind.config
   - CSS vars: leer :root en globals.css
   - Ant Design: leer theme config

3. Comparar y generar diff:
   | Token        | Figma      | Codigo     | Status     |
   |--------------|------------|------------|------------|
   | primary      | #3B82F6    | #3B82F6    | OK         |
   | accent       | #F97316    | #EA580C    | DIFERENTE  |
   | bg-dark      | #172554    | —          | SOLO FIGMA |
   | warning-fg   | —          | #1E293B    | SOLO CODE  |
```

#### 2b. Delta visual (screenshots)
```
1. Capturar Figma:
   get_screenshot(nodeId: "{frameId}", fileKey)

2. Capturar dev server:
   preview_screenshot(serverId)

3. Comparar visualmente:
   - Diferencias de layout
   - Diferencias de color
   - Secciones nuevas o eliminadas
   - Cambios de contenido/texto
```

#### 2c. Delta estructural (componentes)
```
1. Leer estructura Figma:
   get_metadata(nodeId: "{frameId}", fileKey)
   → Contar secciones, componentes, layers

2. Leer estructura codigo:
   - Contar componentes/secciones en page.tsx
   - Leer imports y JSX

3. Comparar:
   - Secciones presentes en ambos
   - Secciones solo en Figma (nuevas del diseñador)
   - Secciones solo en codigo (nuevas del dev)
```

#### 2d. Delta de contenido (textos)
```
1. Extraer textos de Figma:
   Via use_figma: traverse text nodes, extraer characters

2. Extraer textos del codigo:
   Leer strings del JSX/HTML

3. Comparar textos clave:
   - Headlines, subtitles, CTAs
   - Labels de formularios
   - Items de menu
```

### Paso 3: Presentar diff al usuario

```markdown
## Sync Report — {proyecto}
**Figma:** {url}
**Codigo:** {branch}

### Tokens (4 diferencias)
| Token   | Figma   | Codigo  | Accion sugerida      |
|---------|---------|---------|----------------------|
| accent  | #F97316 | #EA580C | Figma es mas reciente |
| bg-dark | #172554 | —       | Agregar al codigo     |

### Layout (1 diferencia)
- Seccion "Testimonials" reordenada en Figma (ahora antes de FAQ)

### Contenido (2 diferencias)
- Hero headline: Figma="Cumplimiento automatizado" vs Code="Cumplimiento COFEPRIS"
- CTA button: Figma="Empezar ahora" vs Code="Solicitar Demo Gratis"

### Estructura (1 diferencia)
- Seccion "Partners" existe en Figma pero no en codigo (nueva)

### Direccion sugerida: Figma → Code
(Figma tiene mas cambios recientes)

¿Aplicar todos los cambios? ¿O seleccionar cuales?
```

### Paso 4: Aplicar delta (segun direccion)

#### Figma → Code: Aplicar cambios del diseño al codigo

**Tokens:**
```
Para cada token diferente:
1. Leer valor de Figma (get_variable_defs o get_design_context)
2. Actualizar en globals.css / tailwind.config / theme file
3. Verificar que el cambio se refleja (preview_screenshot)
```

**Contenido/textos:**
```
Para cada texto diferente:
1. Localizar el texto en el codigo (grep en componentes)
2. Actualizar con Edit tool
3. Verificar con preview_snapshot
```

**Layout (reordenar secciones):**
```
1. Leer orden actual del JSX en page.tsx
2. Reordenar imports y componentes segun orden en Figma
3. Verificar con preview_screenshot
```

**Secciones nuevas (solo en Figma):**
```
1. get_design_context del frame nuevo
2. Generar componente React/Vue/etc
3. Agregar import y render en page.tsx
4. Verificar con preview_screenshot
```

#### Code → Figma: Aplicar cambios del codigo al diseño

**Tokens:**
```
Para cada token diferente:
1. Leer valor del codigo
2. Via use_figma: actualizar variable en coleccion
   figma.variables.getLocalVariables("COLOR")
     .find(v => v.name === "color/accent")
     .setValueForMode(modeId, newColor)
```

**Contenido/textos:**
```
Para cada texto diferente:
1. Via use_figma: encontrar el text node y actualizar
   await figma.loadFontAsync(...)
   textNode.characters = "Nuevo texto"
```

**Secciones nuevas (solo en codigo):**
```
Opcion A — Recaptura selectiva:
  Usar /code-to-figma pero con figmaselector para capturar
  solo la seccion nueva, no toda la pagina

Opcion B — Crear manualmente via use_figma:
  Solo si la seccion es simple (cards, texto, botones)
```

**Layout (reordenar secciones):**
```
Via use_figma:
1. Leer children del frame principal
2. Reordenar con parent.insertChild(newIndex, child)
```

### Paso 5: Verificar sync

```
1. get_screenshot del frame actualizado
2. preview_screenshot del dev server
3. Comparar visualmente
4. Si match → sync completa
5. Si no match → reportar diferencias restantes
```

## Modos de operacion

### Modo completo (default)
Compara todo: tokens, layout, contenido, estructura.
Mejor para syncs periodicos o antes de deploy.

### Modo tokens-only
Solo compara y sincroniza tokens de color, spacing, tipografia.
```
/sync-engine tokens-only https://figma.com/...
```
Delega a `/token-sync` para la ejecucion.

### Modo content-only
Solo compara y sincroniza textos y copy.
```
/sync-engine content-only https://figma.com/...
```

### Modo report-only
Solo genera el diff, no aplica cambios.
```
/sync-engine report https://figma.com/...
```
Similar a `/drift-detection` pero mas estructurado.

## Guardar estado de sync

Para saber que cambio desde la ultima sync, guardar un snapshot:

```json
// .claude/sync-state.json (generado automaticamente)
{
  "lastSync": "2026-04-12T18:30:00Z",
  "figmaFileKey": "1vjmFDBjmW9kbCLeCtq5M1",
  "figmaNodeId": "20:2",
  "tokens": {
    "color/primary": "#3B82F6",
    "color/accent": "#F97316"
  },
  "sections": ["Navbar", "Hero", "LogoBar", "StatsBand", "ProblemSolution",
               "HowItWorks", "Features", "Comparison", "Pricing",
               "Testimonials", "FAQ", "Registration", "Footer"],
  "checksums": {
    "globals.css": "a1b2c3d4",
    "page.tsx": "e5f6g7h8"
  }
}
```

Comparar estado guardado vs estado actual para detectar que cambio
en cada lado desde la ultima sync.

## Decision tree: recapturar vs sync incremental

```
¿Cuantas diferencias hay?

  > 50% de la pagina cambio
    → Recapturar con /code-to-figma (mas eficiente)

  < 50% de cambios
    → Sync incremental (este skill)

  Solo tokens cambiaron
    → /token-sync directo

  Solo textos cambiaron
    → Sync contenido via use_figma
```

## Relacion con otros skills

| Skill | Rol en el sync |
|-------|---------------|
| `/drift-detection` | Paso 2 — deteccion de delta visual |
| `/token-sync` | Paso 4 — sync de tokens bidireccional |
| `/code-to-figma` | Fallback — recaptura completa si delta > 50% |
| `/figma-use` | Prerequisito — reglas para use_figma |
| `/code-connect-bridge` | Setup — mapeo de componentes para sync preciso |
| `/figma-sync` | Padre — orquestador que puede delegar aqui |

## Errores comunes

| Error | Causa | Solucion |
|-------|-------|---------|
| Texto no se actualiza en Figma | Font no cargada | Siempre `loadFontAsync` antes |
| Color diff false positive | Opacity en Figma vs hex plano | Comparar con opacity incluida |
| Seccion "nueva" que ya existia | Nombre diferente en Figma vs codigo | Comparar por posicion, no nombre |
| Sync rompe layout | Se modifico un componente master | Validar instancias despues de cada cambio |
