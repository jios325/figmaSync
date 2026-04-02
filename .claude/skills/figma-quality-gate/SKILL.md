---
name: figma-quality-gate
description: Validacion de calidad post-creacion de pantallas en Figma. Verifica naming, Auto Layout, tokens, consistencia, y Code Connect. Usa despues de crear o modificar pantallas para asegurar que cumplen los estandares.
triggers:
  - "valida la pantalla"
  - "quality check figma"
  - "revisa el diseño"
  - "esta bien la pantalla"
  - "quality gate"
  - "figma lint"
  - "verifica diseño"
tools:
  - use_figma
  - get_metadata
  - get_screenshot
  - get_design_context
  - search_design_system
---

# Figma Quality Gate

Validacion automatizada de calidad para pantallas de Figma.

## Cuando ejecutar

1. **Despues de crear** una pantalla nueva (screen-creator)
2. **Despues de modificar** una pantalla existente
3. **Antes de handoff** a desarrollo
4. **En auditorias** periodicas del archivo

## Checklist de validacion (100 puntos)

### 1. Estructura (25 pts)

| Check | Pts | Criterio |
|---|---|---|
| Frame size correcto | 5 | Width = 1440px |
| Tiene header (base bar) | 5 | Child con name "base bar" presente |
| Tiene sidebar | 5 | Child con name "sidebar" o instancia de "side bar" |
| Tiene bg (content area) | 5 | Child con name "bg", fill #F5F5F5 |
| Naming del frame correcto | 5 | Formato "Seccion / Vista" |

### 2. Componentes (25 pts)

| Check | Pts | Criterio |
|---|---|---|
| Header es instancia | 5 | base bar es INSTANCE, no FRAME |
| Sidebar es instancia | 5 | sidebar es INSTANCE de "side bar" |
| No hay Groups genericos | 5 | Ningun child llamado "Group N" |
| No hay frames sin nombre | 5 | Ningun child llamado "Frame N" |
| Componentes de libreria usados | 5 | Buttons, inputs son instancias (no frames) |

### 3. Tokens y estilos (25 pts)

| Check | Pts | Criterio |
|---|---|---|
| Colores del sistema | 5 | Solo colores definidos en tokens |
| Tipografia correcta | 5 | Solo Roboto, sizes del sistema (12/14/16/20) |
| Spacing consistente | 5 | Gaps y paddings son multiplos de 4 o 8 |
| No hay colores hardcodeados | 5 | Ningun color fuera de la paleta |
| Opacidades correctas | 5 | Text primary 0.85, secondary 0.45, disabled 0.25 |
| Check Designs clean (bonus) | +5 | 0 issues en Check Designs linter nativo (bonus, no resta) |

### 4. Consistencia (25 pts)

| Check | Pts | Criterio |
|---|---|---|
| Breadcrumb presente y correcto | 5 | Texto actualizado, posicion correcta |
| Titulo de pagina presente | 5 | H5, color correcto |
| Alineacion con pantallas hermanas | 5 | Mismo Y para header, mismo X para content |
| Datos reales (no lorem) | 5 | Textos con contenido real del dominio |
| Sin elementos sobrantes | 5 | No hay rectangulos/textos fuera de area |

## Proceso de validacion

### Paso 1: Validacion automatica

```javascript
// Ejecutar via use_figma
const frame = await figma.getNodeByIdAsync(frameId);
const results = {
  structure: {},
  components: {},
  tokens: {},
  consistency: {}
};

// 1. Frame size
results.structure.frameSize = frame.width === 1440;

// 2. Has header
results.structure.hasHeader = frame.children.some(c =>
  c.name === 'base bar' || c.name.includes('header')
);

// 3. Has sidebar
results.structure.hasSidebar = frame.children.some(c =>
  c.name === 'sidebar' || c.name.includes('side bar')
);

// 4. Has bg
results.structure.hasBg = frame.children.some(c => c.name === 'bg');

// 5. Naming
results.structure.naming = frame.name.includes('/');

// 6. No generic groups
const genericNames = frame.findAll(n =>
  /^(Group|Frame) \d+$/.test(n.name)
);
results.components.noGenericNames = genericNames.length === 0;

// 7. Check colors
const allColors = new Set();
frame.findAll(n => {
  if (n.fills && n.fills.length > 0) {
    n.fills.forEach(f => {
      if (f.type === 'SOLID') {
        const hex = rgbToHex(f.color);
        allColors.add(hex);
      }
    });
  }
});
// Compare against allowed colors
```

### Paso 2: Screenshot visual

Tomar screenshot y verificar visualmente:
- Layout no desfasado
- Elementos centrados correctamente
- No hay overlap inesperado
- Responsive dentro del frame

### Paso 3: Lint de diseño

```
figma_lint_design({  (solo con figma-console-mcp, opcional)
  nodeId: frameId,
  rules: ['all']
})
```
Alternativa sin figma-console-mcp: verificar manualmente con `get_screenshot` y `get_metadata`.

Verificar:
- Contraste WCAG (AA minimo)
- Touch targets (44px minimo)
- Text sizing (12px minimo)

### Paso 3b: Check Designs Linter (complemento manual)

El **Check Designs** es el linter nativo de Figma que detecta valores raw que deberian ser variables. Usa un modelo AI que sugiere la variable correcta por contexto.

**Que detecta:**
- Colores hardcodeados que deberian ser variables
- Spacing sin variable asociada
- Tipografia sin text style

**Integracion con scoring:**
- Si el usuario ejecuta Check Designs y reporta 0 issues → **+5 bonus** en categoria "Tokens y estilos" (max 25 sin bonus, 30 con bonus)
- Cada issue de Check Designs en la pantalla evaluada → **-1 punto** en "Tokens y estilos"

**Limitacion:** Check Designs corre en el cliente de Figma, no via API. Si el score de tokens es < 20/25, recomendar al usuario:
> "Ejecuta 'Check Designs' via quick action en Figma para identificar valores raw que deberian usar variables."

### Paso 4: Comparar con pantalla hermana

```javascript
// Leer posiciones clave de la pantalla hermana
const sister = await figma.getNodeByIdAsync(sisterFrameId);
const sisterHeader = sister.children.find(c => c.name === 'base bar');
const currentHeader = frame.children.find(c => c.name === 'base bar');

// Verificar que las posiciones coincidan
const alignment = {
  headerY: sisterHeader.y === currentHeader.y,
  headerH: sisterHeader.height === currentHeader.height,
  // ...
};
```

## Scoring

| Score | Estado | Accion |
|---|---|---|
| 90-100 | ✅ Aprobado | Listo para handoff |
| 70-89 | ⚠️ Warnings | Revisar items fallidos |
| 50-69 | 🟡 Necesita trabajo | Corregir antes de handoff |
| 0-49 | 🔴 Reprobado | Requiere reestructuracion |

## Output esperado

```
## Quality Gate Report
- Pantalla: {nombre}
- Node ID: {id}
- Score: {N}/100

## Detalle por categoria
| Categoria | Score | Detalle |
|---|---|---|
| Estructura | {N}/25 | {items fallidos} |
| Componentes | {N}/25 | {items fallidos} |
| Tokens | {N}/25 | {items fallidos} |
| Consistencia | {N}/25 | {items fallidos} |

## Issues encontrados
| Severidad | Issue | Solucion |
|---|---|---|
| 🔴 Error | {descripcion} | {como corregir} |
| ⚠️ Warning | {descripcion} | {como corregir} |
| 💡 Info | {descripcion} | {sugerencia} |

## Screenshot de validacion
[screenshot adjunto]
```

## Integracion con otros skills

| Despues de... | Ejecutar quality-gate para... |
|---|---|
| screen-creator | Validar la nueva pantalla |
| variant-generator | Validar las nuevas variantes |
| component-library-sync | Validar organizacion del Design System |
| token-sync | Validar que tokens se aplicaron correctamente |
| drift-detection | Validar correcciones aplicadas |
