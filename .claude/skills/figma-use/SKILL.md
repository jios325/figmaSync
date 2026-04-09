---
name: figma-use
description: "Prerequisito OBLIGATORIO para cualquier operacion con use_figma. Contiene reglas pre-flight, gotchas, y patrones del Plugin API de Figma. DEBE cargarse antes de cada llamada a use_figma. Si el canal de escritura es figma-console-mcp, estas reglas aplican tambien a figma_execute."
triggers:
  - "use_figma"
  - "escribir en figma"
  - "crear en figma"
  - "modificar figma"
tools:
  - use_figma
  - get_metadata
  - get_screenshot
  - search_design_system
---

# figma-use — Prerequisito para Escribir en Figma

## REGLA CRITICA

> Este skill DEBE cargarse antes de CUALQUIER llamada a `use_figma` o `figma_execute`.
> Las reglas aqui previenen los errores mas comunes del Plugin API de Figma.

## Pre-flight Checklist (17 Reglas)

Antes de cada `use_figma` call, verificar que el codigo cumple TODAS estas reglas:

### 1. Return, NUNCA closePlugin
```javascript
// WRONG
figma.closePlugin();

// CORRECT
return { success: true, nodeId: frame.id };
```

### 2. Colores van de 0 a 1, NO 0 a 255
```javascript
// WRONG
fills: [{ type: 'SOLID', color: { r: 255, g: 0, b: 0 } }]

// CORRECT
fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]

// Helper para convertir hex:
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

### 3. Fills y Strokes son arrays READ-ONLY — clonar antes de modificar
```javascript
// WRONG
node.fills[0].color = { r: 1, g: 0, b: 0 };

// CORRECT
const fills = JSON.parse(JSON.stringify(node.fills));
fills[0].color = { r: 1, g: 0, b: 0 };
node.fills = fills;
```

### 4. Fonts DEBEN cargarse antes de modificar texto
```javascript
// WRONG
textNode.characters = "Hello";

// CORRECT
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
textNode.characters = "Hello";
```

### 5. Page context se RESETEA en cada llamada
```javascript
// Cada use_figma call empieza en una pagina limpia
// SIEMPRE navegar a la pagina correcta primero:
const page = figma.root.children.find(p => p.name === "My Page");
if (page) await figma.setCurrentPageAsync(page);
```

### 6. figma.notify() LANZA ERROR en use_figma
```javascript
// WRONG
figma.notify("Done!");

// CORRECT — simplemente no usar notify
return { message: "Done!" };
```

### 7. layoutSizingHorizontal/Vertical DESPUES de appendChild
```javascript
// WRONG
child.layoutSizingHorizontal = 'FILL';
parent.appendChild(child);  // Error: child no tiene parent con auto-layout

// CORRECT
parent.appendChild(child);
child.layoutSizingHorizontal = 'FILL';
```

### 8. Usar setCurrentPageAsync, NO asignar figma.currentPage
```javascript
// WRONG
figma.currentPage = page;

// CORRECT
await figma.setCurrentPageAsync(page);
```

### 9. Scripts fallidos son ATOMICOS — no hay cambios parciales
Si un `use_figma` call falla, NINGUN cambio se aplica al documento. No hay que limpiar nada.

### 10. Un solo proposito por llamada
Cada `use_figma` call debe hacer UNA cosa y retornar los IDs creados. No meter multiples operaciones.

### 11. SIEMPRE retornar IDs de los nodos creados
```javascript
// CORRECT
const frame = figma.createFrame();
frame.name = "Container";
return { frameId: frame.id, frameName: frame.name };
```

### 12. Verificar existencia antes de crear (idempotencia)
```javascript
// CORRECT — check-before-create
let collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === "Primitives");
if (!collection) {
  collection = figma.variables.createVariableCollection("Primitives");
}
```

### 13. getNodeByIdAsync para obtener nodos de llamadas anteriores
```javascript
// CORRECT — usar ID retornado de un call previo
const node = await figma.getNodeByIdAsync("123:456");
if (!node) return { error: "Node not found" };
```

### 14. loadAllPagesAsync antes de operaciones cross-page
```javascript
// Si necesitas acceder a nodos en otras paginas:
await figma.loadAllPagesAsync();
```

### 15. Auto Layout: primero layoutMode, luego propiedades
```javascript
// CORRECT
frame.layoutMode = "VERTICAL";
frame.primaryAxisAlignItems = "MIN";
frame.counterAxisAlignItems = "MIN";
frame.paddingTop = frame.paddingBottom = 16;
frame.paddingLeft = frame.paddingRight = 16;
frame.itemSpacing = 8;
```

### 15b. Auto Layout es DESTRUCTIVO — guardar positions antes de aplicar
```javascript
// Auto Layout re-posiciona TODOS los hijos. Revertir layoutMode=NONE
// NO restaura las posiciones originales. SIEMPRE guardar antes:

// PASO 1: Guardar posiciones
const savedPositions = {};
for (const child of component.children) {
  savedPositions[child.id] = { x: child.x, y: child.y, w: child.width, h: child.height };
}

// PASO 2: Aplicar Auto Layout
component.layoutMode = "HORIZONTAL";
// ... configurar propiedades

// PASO 3: Si se rompe, restaurar
component.layoutMode = "NONE";
for (const child of component.children) {
  const pos = savedPositions[child.id];
  if (pos) { child.x = pos.x; child.y = pos.y; child.resize(pos.w, pos.h); }
}
```

### 15c. Preservar textAutoResize al modificar componentes
```javascript
// PELIGRO: Al aplicar/revertir Auto Layout, textAutoResize puede cambiar
// de WIDTH_AND_HEIGHT a NONE. Esto rompe instancias con texto largo.

// ANTES de modificar un componente, guardar textAutoResize de TODOS los text nodes:
const savedTextProps = {};
function saveTextProps(node) {
  if (node.type === 'TEXT') {
    savedTextProps[node.id] = {
      textAutoResize: node.textAutoResize,
      w: node.width, h: node.height
    };
  }
  if ('children' in node) node.children.forEach(saveTextProps);
}
saveTextProps(component);

// DESPUES de modificar, restaurar:
function restoreTextProps(node) {
  if (node.type === 'TEXT' && savedTextProps[node.id]) {
    node.textAutoResize = savedTextProps[node.id].textAutoResize;
  }
  if ('children' in node) node.children.forEach(restoreTextProps);
}
restoreTextProps(component);
```

### 15d. NO aplicar Auto Layout a componentes con layout absoluto complejo
```javascript
// PELIGROSO — componentes donde hijos se superponen o usan x/y intencional:
// ❌ Cards con imagen + texto superpuesto
// ❌ Tables/rows con columnas a x fijo
// ❌ Componentes con children que desbordan el parent
// ❌ Cualquier componente donde children tienen x > 0 en patron no-secuencial

// SEGURO — componentes donde hijos son secuenciales:
// ✅ Buttons (icon + text)
// ✅ Tags (text + badge)
// ✅ Simple inputs (icon + field)
// ✅ Componentes con un solo child
```

### 15d. Detectar librerias externas antes de modificar
```javascript
// Componentes con remote=true son de librerias externas (Ant Design, etc.)
// NUNCA modificar, mover, o intentar reemplazar estos componentes
const isExternal = node.mainComponent && node.mainComponent.remote === true;
if (isExternal) {
  // Respetar — no tocar
  return;
}
```

### 16. Component properties: usar setProperties con key completo
```javascript
// WRONG
instance.setProperties({ "Label": "Click me" });

// CORRECT — usar la key completa del property
const props = instance.componentProperties;
// Las keys tienen formato "PropertyName#ID:ID"
for (const [key, prop] of Object.entries(props)) {
  if (key.startsWith("Label")) {
    instance.setProperties({ [key]: "Click me" });
  }
}
```

### 17. Para Figma con "Inter" font: el style es "Semi Bold" (con espacio)
```javascript
// WRONG
await figma.loadFontAsync({ family: "Inter", style: "SemiBold" });

// CORRECT
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
// Tambien: "Extra Bold" (no "ExtraBold")
```

## Patron de Ejecucion

```
1. INSPECT primero — usar get_metadata para entender la estructura antes de modificar
2. UNA COSA por call — cada use_figma hace una operacion y retorna IDs
3. RETURN IDs — siempre retornar los IDs de nodos creados/modificados
4. VALIDATE despues — usar get_metadata o get_screenshot para verificar
```

## Buscar Antes de Crear

Antes de crear componentes, variables, o estilos, SIEMPRE buscar si ya existen:

```javascript
// Buscar en librerias publicadas:
search_design_system({ query: "Button", fileKey: "{fileKey}" })
// Si existe → importar con importComponentByKeyAsync(key)

// Buscar variables locales:
const existing = figma.variables.getLocalVariables()
  .find(v => v.name === "color/primary");

// Buscar colecciones locales:
const collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === "Primitives");
```

## Validacion Post-Operacion

Despues de CADA `use_figma` call que crea o modifica nodos:

1. **Estructura:** `get_metadata(nodeId, fileKey)` — verificar que el nodo existe con la estructura esperada
2. **Visual:** `get_screenshot(nodeId, fileKey)` — verificar que se ve como se espera
3. **Si algo fallo:** NO intentar arreglar parcialmente — hacer una nueva llamada limpia

## Error Recovery

```
Si use_figma falla:
1. STOP — no intentar arreglar inline
2. INSPECT — get_metadata para ver el estado actual
3. RETRY — nueva llamada limpia (los scripts fallidos son atomicos)
4. Si falla 2+ veces → reportar al usuario
```

## Scripts Helper Disponibles

En `scripts/` hay helpers JS reutilizables que se pueden pasar como codigo a `use_figma`:

| Script | Proposito |
|--------|-----------|
| `inspectFileStructure.js` | Descubrir paginas, colecciones, componentes, estilos |
| `createVariableCollection.js` | Crear coleccion con modes (idempotente) |
| `createSemanticTokens.js` | Crear variables semanticas con aliases |
| `validateCreation.js` | Verificar que nodos creados son los esperados |
| `cleanupOrphans.js` | Limpiar nodos huerfanos por identificador |
| `layoutPageGrid.js` | Organizar nodos de una pagina en grid sin traslapes |

## Referencia Rapida: Que Funciona y Que NO

### Funciona en use_figma:
- Crear frames, text, shapes, components
- Auto layout (layoutMode, padding, gap, alignment)
- Fills, strokes, effects (shadows, blur)
- Variables: crear colecciones, variables, modes, aliases, binding
- Importar componentes de librerias: `importComponentByKeyAsync`
- Importar estilos: `importStyleByKeyAsync`
- Crear component sets con variantes
- Text styles, effect styles

### NO funciona en use_figma:
- `figma.notify()` — lanza error
- `figma.closePlugin()` — usar return en su lugar
- `figma.currentPage = page` — usar `setCurrentPageAsync`
- `figma.showUI()` — no hay UI en MCP context
- Exportar imagenes (exportAsync) — usar get_screenshot en su lugar
- Acceder a `figma.clientStorage` — no persiste entre calls
- `figma.on()` / `figma.off()` — no hay event listeners en MCP

## Relacion con Otros Skills

| Skill | Como usa figma-use |
|-------|-------------------|
| `/screen-creator` | Carga figma-use antes de crear frames y componentes |
| `/normalization-pipeline` | Carga figma-use en Fase 2 (tokenizacion) y Fase 4 (componentizacion) |
| `/token-sync` | Carga figma-use antes de crear/actualizar variables |
| `/variant-generator` | Carga figma-use antes de crear variantes |
| `/component-library-sync` | Carga figma-use antes de mover/organizar componentes |
