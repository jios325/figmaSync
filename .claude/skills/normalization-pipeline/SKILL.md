---
name: normalization-pipeline
description: "Pipeline completo para normalizar cualquier archivo Figma desordenado. Ejecuta 6 fases en orden estricto: auditoria, limpieza, tokenizacion, auto layout, componentizacion, validacion. Usa cuando el usuario pide normalizar, limpiar, organizar, o arreglar un archivo de Figma desde cero."
triggers:
  - "normaliza este archivo"
  - "limpia este figma"
  - "organiza este archivo"
  - "normalization pipeline"
  - "cleanup figma"
  - "arregla este archivo"
tools:
  - figma_execute
  - figma_get_status
  - figma_get_file_data
  - figma_lint_design
  - figma_setup_design_tokens
  - figma_batch_create_variables
  - figma_capture_screenshot
  - figma_rename_node
  - figma_search_components
---

# Normalization Pipeline — Normalizar Cualquier Archivo Figma

## Principio

> TOKENS PRIMERO → COMPONENTES DESPUES. Siempre.

Los tokens son la capa fundacional. Los componentes son consumidores de tokens.
Si componentizas antes de tokenizar, tendras que re-hacer todo.

## Prerequisitos

1. Figma Desktop con plugin Desktop Bridge corriendo (punto verde)
2. Verificar conexion: `figma_get_status`
3. URL del archivo Figma a normalizar

## Pipeline: 6 Fases en Orden Estricto

### Fase 0: AUDITORIA (read-only)

**Objetivo:** Entender que hay en el archivo sin modificar nada.

1. Parsear URL de Figma → extraer fileKey y nodeId
2. Escanear estructura completa:
   ```
   get_metadata(nodeId: "0:1", fileKey)
   ```
3. Extraer inventario de colores REALES del archivo:
   ```javascript
   // figma_execute: traverse all nodes, extract unique hex values with counts
   const colorMap = {};
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
   ```
4. Extraer inventario de tipografia (font families, sizes, weights)
5. Extraer inventario de spacing (padding, gap values)
6. Identificar layers genericos ("Frame 123", "Group 45", "Rectangle 67")
7. Identificar nesting excesivo (>6 niveles)
8. Contar componentes locales vs frames sueltos
9. Verificar si existen colecciones de variables

**OUTPUT:** Reporte de auditoria con:
- Score inicial (0-100)
- Tabla de colores ordenados por frecuencia
- Conteo de layers genericos
- Conteo de nesting excesivo
- Inventario de componentes vs frames

**CHECKPOINT:** Mostrar reporte al usuario. Preguntar si continuar.

---

### Fase 1: LIMPIEZA ESTRUCTURAL

**Objetivo:** Organizar la estructura sin tocar colores ni componentes.

1. **Renombrar layers genericos:**
   ```javascript
   // figma_execute: find all nodes named "Frame N", "Group N", "Rectangle N"
   // Rename based on content/context:
   // - Frame con children de texto → usar el texto como nombre
   // - Frame con fills de color → "bg-{color}" o "container"
   // - Group contenedor → "wrapper" o nombre del contexto padre
   ```

2. **Aplanar nesting innecesario:**
   - Eliminar grupos de un solo hijo (promover el hijo al padre)
   - Colapsar wrappers sin proposito visual
   - Target: max 6 niveles de profundidad

3. **Organizar paginas:**
   - Renombrar "Page 1", "Untitled" → nombres descriptivos
   - Crear pagina "Design System" si no existe
   - Crear pagina "Cover" si no existe

4. **Eliminar orphans:**
   - Layers ocultos sin proposito
   - Frames vacios (0 children)
   - Instancias de componentes borrados

5. **Estandarizar frames principales:**
   - Desktop: 1440px de ancho
   - Mobile: 375px de ancho
   - Altura: hug contents (no fija)

**CHECKPOINT:** Screenshot antes/despues. Si algo se ve mal → Cmd+Z.

---

### Fase 2: TOKENIZACION (Estrategia Hibrida)

**Objetivo:** Crear variables y aplicarlas por CONTEXTO (no por hex match). La apariencia visual NO debe cambiar.

**REGLA CRITICA:** La fuente de verdad de colores es SIEMPRE el diseno actual, NO el codigo.

#### Paso 2.1: Copiar referencia visual ANTES de tocar nada

```javascript
// figma_execute: duplicar la seccion de componentes locales como backup
// Nombrar la copia "Componentes Locales — REFERENCIA (no tocar)"
```
Ademas, tomar screenshots de 5+ pantallas representativas como referencia.

#### Paso 2.2: Escanear colores reales (ALL fill types)

```javascript
// figma_execute: traverse ALL nodes, extract:
// - fills SOLID → hex + count
// - fills IMAGE → count + node names (placeholders)
// - fills GRADIENT → count
// Ademas registrar CONTEXTO de uso:
// - ¿En que tipo de nodo aparece? (sidebar, boton, header, texto, placeholder)
// - ¿Cual es el nombre del nodo o su padre?
```

**OUTPUT:** Tabla de colores con columnas: hex, count, contextos de uso principales.

#### Paso 2.3: Crear colecciones con colores reales

Solo Light mode (Default). Incluir token especial para placeholders:

```
Primitives: todos los hex unicos agrupados por familia
Semantic: mapeo por USO/CONTEXTO:
  color/bg/page        → fondo de frames principales
  color/bg/primary     → fondo de contenido (blanco)
  color/bg/sidebar     → fondo de sidebar (corpo)
  color/bg/elevated    → fondo elevado (gris claro)
  color/text/title     → titulos (negro)
  color/text/primary   → texto principal (gris oscuro)
  color/text/secondary → texto secundario (gris medio)
  color/border/default → bordes (gris)
  color/action/primary → acciones primarias (azul)
  color/brand/corpo    → color corporativo (teal oscuro)
  color/brand/*        → colores de marca (gold, navy, etc.)
  color/neutral/placeholder → #BFBFBF (gris para Upload/Image placeholders)
  color/feedback/*     → error, success, warning
```

#### Paso 2.4: Aplicar variables por CONTEXTO (3 fases)

**Fase A — Por estructura/nombre (mas seguro, sin ambiguedad):**
```javascript
// figma_execute: aplicar segun nombre o estructura del nodo
// - Nodo con nombre "sidebar" o "side bar" → color/bg/sidebar
// - Frame principal (width >= 1440) → color/bg/page
// - Nodo con nombre "bg" o "background" → color/bg/primary o color/bg/elevated
// - Nodo con nombre "header" o "base bar" → color/brand/corpo
// - Nodo con nombre "divisor" o "divider" → color/border/default
// - Nodo tipo TEXT → clasificar por fontSize:
//     >= 20px → color/text/title
//     >= 14px → color/text/primary
//     < 14px → color/text/secondary
```

**Fase B — Por tipo de componente (requiere verificacion):**
```javascript
// Para componentes (COMPONENT/COMPONENT_SET):
// - Botones con fill oscuro intencional → NO CAMBIAR (mantener color/brand/corpo)
// - Steps/badges con fill oscuro → NO CAMBIAR
// - Tabs inactivos con fill oscuro → VERIFICAR con referencia
// - Placeholders (RECTANGLE/FRAME con IMAGE fill) → color/neutral/placeholder
// - Upload instances con fill negro → cambiar a color/neutral/placeholder
```

**Fase C — Batch-apply RESIDUAL (solo nodos no procesados):**
```javascript
// SOLO para nodos que NO fueron procesados en Fase A y B
// Aplicar por hex match: hex → variable con MISMO valor
// Esto es el fallback, no el metodo principal
// Despues de esta fase, verificar manualmente los nodos afectados
```

#### Paso 2.5: Verificacion componente por componente

1. Screenshot de cada componente de la libreria local
2. Comparar con la copia de referencia del Paso 2.1
3. Buscar problemas especificos:
   - Textos invisibles (texto del mismo color que el fondo)
   - Placeholders que siguen negros (fills IMAGE no procesados)
   - Colores que cambiaron cuando no debian
   - Tabs/navigation con fondos incorrectos
4. Si algo se ve mal → arreglar SOLO ese componente, no re-hacer todo

**CHECKPOINT:** Todos los componentes deben verse IDENTICOS a la referencia.

#### Errores a Prevenir (lecciones aprendidas)

| Error | Prevencion |
|-------|------------|
| Usar colores del codigo | SIEMPRE escanear hex reales del archivo |
| Borrar colecciones y crear huerfanas | NUNCA borrar. Usar undo si hay que empezar de nuevo |
| Mismo hex aplicado donde no debe | Aplicar por CONTEXTO primero, hex match solo como fallback |
| Fills IMAGE ignorados | Escanear ALL fill types, no solo SOLID |
| Cambiar colores intencionales | Componentes con fills oscuros intencionales → NO CAMBIAR |
| Dark mode innecesario | Solo Default mode salvo indicacion explicita |

---

### Fase 3: AUTO LAYOUT

**Objetivo:** Convertir layouts de posicion absoluta a Auto Layout (Flexbox).

**Enfoque: bottom-up** — empezar por las hojas, subir a los contenedores.

1. **Nivel 1 — Atomos:** Botones, badges, tags, inputs
   ```javascript
   // Detectar frames con 1-3 hijos alineados
   // Inferir direction: horizontal si hijos estan side-by-side
   // Inferir gap del espacio entre hijos
   // Aplicar: node.layoutMode = "HORIZONTAL" o "VERTICAL"
   ```

2. **Nivel 2 — Moleculas:** Cards, form groups, list items
   - Padding de los bordes del contenedor
   - Gap entre elementos internos

3. **Nivel 3 — Organismos:** Headers, sidebars, content areas
   - Fill container para el ancho
   - Hug contents para la altura

4. **Nivel 4 — Paginas:** Frames principales
   - Layout principal: horizontal (sidebar + content)
   - Content area: vertical (header + body)

**Resizing:**
- `FILL` → elementos que deben crecer con el padre
- `HUG` → elementos con tamaño intrinseco
- `FIXED` → solo cuando el tamaño NUNCA debe cambiar (ej: sidebar 240px)

**CHECKPOINT:** Screenshot de cada pantalla convertida. Verificar que no hay overlap.

---

### Fase 4: COMPONENTIZACION

**Objetivo:** Extraer patrones repetidos como componentes reutilizables.

**PREREQUISITO:** Los tokens DEBEN estar aplicados (Fase 2 completada).

1. **Identificar patrones repetidos:**
   ```javascript
   // figma_execute: find frames with similar structure
   // Criteria: same children count, similar dimensions, same fills
   // Group by visual similarity
   ```

2. **Seleccionar version canonica:**
   - La instancia mas frecuente o mas pulida
   - La que ya tiene tokens aplicados

3. **Promover a componente (bottom-up):**
   - Atomos primero: botones, inputs, badges
   - Moleculas despues: cards, form groups
   - Organismos al final: headers, sidebars

4. **Crear pagina Design System:**
   ```javascript
   // figma_execute
   let dsPage = figma.root.children.find(p => p.name === 'Design System');
   if (!dsPage) {
     dsPage = figma.createPage();
     dsPage.name = 'Design System';
   }
   ```

5. **Organizar por categoria:**
   - Ejecutar `/component-library-sync` para organizar
   - Categorias: Bars, Cards, Navigation, Forms, Buttons, Layout, Modals

6. **Reemplazar copias con instancias:**
   ```javascript
   // Para cada componente creado:
   // Buscar frames identicos en todas las paginas
   // Reemplazar con instancias del componente
   ```

**CHECKPOINT:** Inventario de componentes creados. Screenshot de Design System page.

---

### Fase 5: VALIDACION

**Objetivo:** Verificar que todo esta correcto y generar score final.

1. **Ejecutar lint:**
   ```
   figma_lint_design({ rules: ["all"] })
   ```

2. **Ejecutar quality gate en pantallas clave:**
   - Login/home
   - Una pantalla de lista
   - Una pantalla de formulario
   - Una pantalla de dashboard

3. **Medir cobertura de tokenizacion:**
   ```javascript
   // figma_execute: count fills with vs without variable bindings
   let bound = 0, unbound = 0;
   function count(node) {
     if ('fills' in node && Array.isArray(node.fills)) {
       for (let i = 0; i < node.fills.length; i++) {
         const b = node.boundVariables?.fills;
         if (b && b[i]) bound++; else if (node.fills[i].type === 'SOLID') unbound++;
       }
     }
     if ('children' in node) node.children.forEach(count);
   }
   // Report: bound / (bound + unbound) * 100 = % tokenizado
   ```

4. **Generar reporte final:**
   ```markdown
   # Normalization Report

   **Archivo:** {nombre}
   **Score Inicial:** {X}/100
   **Score Final:** {Y}/100

   ## Metricas
   | Metrica | Antes | Despues |
   |---------|-------|---------|
   | Colores tokenizados | 0% | {X}% |
   | Layers genericos | {N} | {M} |
   | Componentes locales | {N} | {M} |
   | Auto Layout coverage | {N}% | {M}% |

   ## Colecciones de Variables
   | Coleccion | Variables | Modo |
   |-----------|----------|------|
   | Primitives | {N} | Default |
   | Semantic | {N} | Default |

   ## Componentes
   | Categoria | Count |
   |-----------|-------|
   | Bars | {N} |
   | Cards | {N} |
   | ... | ... |
   ```

---

## Reglas Criticas

1. **NUNCA cambiar la apariencia visual** — tokenizar = vincular variable al mismo color, no cambiar colores
2. **Fuente de verdad = el diseno** — NO el codigo, NO Ant Design estandar, NO paletas inventadas
3. **Solo Light mode por defecto** — Dark mode solo si el diseno original lo tiene
4. **Colores de marca = tokens** — dorado, navy, teal corporativo, todos van como `color/brand/*`
5. **Checkpoint visual despues de cada fase** — si algo se ve mal, undo antes de continuar
6. **Batch por pagina** — procesar una pagina a la vez para evitar timeout de `figma_execute` (30s max)
7. **Mismo hex ≠ mismo significado** — un color puede ser correcto en un componente e incorrecto en otro. Despues del batch-apply, revisar componente por componente
8. **NUNCA borrar colecciones sin limpiar bindings** — las referencias huerfanas hacen que Figma renderice nodos como negro. Preferir undo sobre borrar+recrear
9. **Escanear ALL fill types** — no solo SOLID. Los fills IMAGE aparecen como cuadros negros si no se tratan
10. **Copiar referencia visual ANTES de tokenizar** — duplicar la seccion de componentes locales como referencia para comparar despues del batch-apply

## Edge Cases

- **Archivo sin pantallas (solo componentes):** Saltar Fase 1 y 3, ir directo a tokenizar
- **Archivo con libreria externa (Ant Design, MUI):** NO tokenizar componentes externos, solo los locales
- **Archivo muy grande (200+ frames):** Auditar por sampling (1 de cada 3), tokenizar todo
- **Archivo con Dark mode existente:** Crear modes Light + Dark en las colecciones
- **Archivo con variables existentes (bien hechas):** Respetar y extender, no reemplazar

## Relacion con Otros Skills

| Fase | Skill Invocado |
|------|----------------|
| Fase 0 | `/design-normalizer` (auditoria) |
| Fase 2 | `/token-sync` (crear y aplicar tokens) |
| Fase 4 | `/component-library-sync` (organizar componentes) |
| Fase 5 | `/figma-quality-gate` (validacion) |
