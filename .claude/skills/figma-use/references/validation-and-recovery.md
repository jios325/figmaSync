# Validacion y Recovery

## Validar Despues de Cada Operacion

### Validacion Estructural (get_metadata)
```
get_metadata(nodeId: "{nodeIdCreado}", fileKey: "{fileKey}")
```
Verifica:
- El nodo existe con el ID retornado
- Tiene el nombre correcto
- Tiene el tipo correcto (FRAME, COMPONENT, TEXT, etc.)
- Tiene el numero de children esperado
- Posicion y tamano son correctos

### Validacion Visual (get_screenshot)
```
get_screenshot(nodeId: "{nodeIdCreado}", fileKey: "{fileKey}")
```
Verifica:
- El nodo se ve como se espera
- No hay overlap inesperado
- Colores y tipografia son correctos
- Auto layout esta aplicado correctamente

### Cuando Usar Cual

| Situacion | Herramienta | Razon |
|-----------|-------------|-------|
| Verificar estructura creada | `get_metadata` | Rapido, datos estructurales |
| Verificar apariencia visual | `get_screenshot` | Detecta problemas visuales |
| Despues de crear frame/componente | Ambos | Estructura + visual |
| Despues de aplicar variables | `get_screenshot` | El color visual es lo que importa |
| Despues de auto layout | `get_screenshot` | Detecta overflow y overlap |
| Despues de mover/resize | `get_metadata` | Posicion y tamano son datos |

## Error Recovery Protocol

### Paso 1: STOP
No intentar arreglar inline en el mismo `use_figma` call. Los scripts fallidos son atomicos — si falla, no se aplico nada.

### Paso 2: INSPECT
```
get_metadata(nodeId: "0:1", fileKey: "{fileKey}")
```
Ver el estado actual del archivo. Identificar que si se creo y que no.

### Paso 3: RETRY
Hacer una nueva llamada `use_figma` limpia. Usar `getNodeByIdAsync` para acceder a nodos de llamadas anteriores.

### Paso 4: Si falla 2+ veces
Reportar el error al usuario. Posibles causas:
- El nodo target no existe (fue eliminado o movido)
- Permisos insuficientes (archivo read-only)
- Font no disponible
- Libreria no publicada
- Plan no soporta la operacion (Extended Collections en non-Enterprise)

## Patrones de Idempotencia

### Check-Before-Create
```javascript
// Variables
let collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === "Primitives");
if (!collection) {
  collection = figma.variables.createVariableCollection("Primitives");
}

// Paginas
let page = figma.root.children.find(p => p.name === "Design System");
if (!page) {
  page = figma.createPage();
  page.name = "Design System";
}

// Componentes
const existing = figma.root.findOne(n =>
  n.type === "COMPONENT" && n.name === "Button"
);
if (existing) return { componentId: existing.id, existed: true };
```

### Estado via SharedPluginData
Para operaciones multi-paso, usar sharedPluginData como state:
```javascript
// Guardar estado
node.setSharedPluginData("dsb", "phase", "tokens-complete");
node.setSharedPluginData("dsb", "run_id", "build-2024-01");

// Leer estado
const phase = node.getSharedPluginData("dsb", "phase");
if (phase === "tokens-complete") {
  // Saltar a la siguiente fase
}
```

## Errores Comunes y Soluciones

| Error | Causa | Solucion |
|-------|-------|----------|
| "Cannot read properties of null" | Nodo no existe o no se cargo | Usar `await getNodeByIdAsync()` y verificar null |
| "Font not loaded" | No se llamo loadFontAsync | Cargar la font ANTES de modificar texto |
| "Cannot modify fills" | Array read-only | Clonar con JSON.parse(JSON.stringify()) |
| "Property not found" | Key de propiedad incorrecta | Usar key completa de componentProperties |
| "Collection already exists" | Duplicate creation | Usar check-before-create pattern |
| "Page context reset" | Cada call empieza limpio | Navegar a la pagina al inicio del script |
| "Node not on current page" | Nodo en otra pagina | loadAllPagesAsync + setCurrentPageAsync |
