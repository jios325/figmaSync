# Gotchas del Plugin API de Figma

Errores comunes con codigo WRONG y CORRECT. Compilado del repo oficial de Figma.

## Fills y Strokes

```javascript
// WRONG — fills es read-only array
node.fills[0].color = { r: 1, g: 0, b: 0 };

// CORRECT — clonar, modificar, reasignar
const fills = JSON.parse(JSON.stringify(node.fills));
fills[0].color = { r: 1, g: 0, b: 0 };
node.fills = fills;
```

```javascript
// WRONG — agregar fill sin clonar
node.fills.push({ type: 'SOLID', color: { r: 0, g: 0, b: 1 } });

// CORRECT
node.fills = [...node.fills, { type: 'SOLID', color: { r: 0, g: 0, b: 1 } }];
```

## Colores

```javascript
// WRONG — rango 0-255
{ r: 255, g: 128, b: 0 }

// CORRECT — rango 0-1
{ r: 1, g: 0.5, b: 0 }

// Helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

## Texto

```javascript
// WRONG — font no cargada
const text = figma.createText();
text.characters = "Hello";  // Error!

// CORRECT
const text = figma.createText();
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
text.characters = "Hello";
```

```javascript
// WRONG — font style sin espacio
await figma.loadFontAsync({ family: "Inter", style: "SemiBold" });

// CORRECT — "Semi Bold" con espacio
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
// Tambien: "Extra Bold", "Extra Light"
```

```javascript
// WRONG — cambiar fuente en rango sin cargar la nueva
text.setRangeFontName(0, 5, { family: "Roboto", style: "Bold" });

// CORRECT — cargar la fuente target primero
await figma.loadFontAsync({ family: "Roboto", style: "Bold" });
text.setRangeFontName(0, 5, { family: "Roboto", style: "Bold" });
```

## Auto Layout

```javascript
// WRONG — layoutSizing antes de appendChild
child.layoutSizingHorizontal = 'FILL';
parent.appendChild(child);

// CORRECT — appendChild primero, luego sizing
parent.appendChild(child);
child.layoutSizingHorizontal = 'FILL';
```

```javascript
// WRONG — asignar propiedades de auto layout sin layoutMode
frame.paddingTop = 16;  // No tiene efecto sin layoutMode

// CORRECT — primero layoutMode
frame.layoutMode = "VERTICAL";
frame.paddingTop = 16;
```

```javascript
// WRONG — layoutSizingHorizontal en nodo sin parent con auto layout
orphanNode.layoutSizingHorizontal = 'FILL';  // No tiene efecto

// CORRECT — solo funciona cuando el parent tiene layoutMode
```

## Paginas

```javascript
// WRONG — asignar currentPage
figma.currentPage = page;

// CORRECT — usar async method
await figma.setCurrentPageAsync(page);
```

```javascript
// WRONG — asumir que estas en la pagina correcta
const frame = figma.createFrame();  // Se crea en pagina default

// CORRECT — navegar primero
const page = figma.root.children.find(p => p.name === "Design System");
await figma.setCurrentPageAsync(page);
const frame = figma.createFrame();
```

## Variables

```javascript
// WRONG — crear variable sin especificar collection
figma.variables.createVariable("color/primary", "COLOR");

// CORRECT — siempre con collection
const collection = figma.variables.createVariableCollection("Primitives");
const variable = figma.variables.createVariable("color/primary", collection, "COLOR");
```

```javascript
// WRONG — setValueForMode con mode name
variable.setValueForMode("Light", { r: 0, g: 0, b: 1 });

// CORRECT — setValueForMode con mode ID
const modeId = collection.modes[0].modeId;
variable.setValueForMode(modeId, { r: 0, g: 0, b: 1 });
```

```javascript
// WRONG — alias con objeto directo
variable.setValueForMode(modeId, targetVariable);

// CORRECT — alias con VARIABLE_ALIAS wrapper
variable.setValueForMode(modeId, {
  type: 'VARIABLE_ALIAS',
  id: targetVariable.id
});
```

## Componentes

```javascript
// WRONG — setProperties con nombre corto
instance.setProperties({ "Label": "Click me" });

// CORRECT — usar key completa (formato "Name#ID:ID")
const props = instance.componentProperties;
for (const [key, prop] of Object.entries(props)) {
  if (key.startsWith("Label")) {
    instance.setProperties({ [key]: "Click me" });
  }
}
```

```javascript
// WRONG — acceder a mainComponent sin verificar
const main = instance.mainComponent;
const name = main.name;  // main puede ser null si el componente es remoto

// CORRECT
const main = instance.mainComponent;
if (main) {
  const name = main.name;
}
```

## Nodos

```javascript
// WRONG — getNodeById sincrono
const node = figma.getNodeById("123:456");

// CORRECT — usar version async
const node = await figma.getNodeByIdAsync("123:456");
```

```javascript
// WRONG — asumir que un nodo tiene children
node.children.forEach(child => ...);  // Error si node no tiene children

// CORRECT — verificar tipo
if ('children' in node) {
  node.children.forEach(child => ...);
}
```

## Miscelaneos

```javascript
// WRONG — figma.notify en MCP context
figma.notify("Success!");  // Lanza error

// CORRECT — retornar mensaje
return { message: "Success!" };
```

```javascript
// WRONG — figma.closePlugin
figma.closePlugin();  // No usar en MCP

// CORRECT — return
return { done: true };
```

```javascript
// WRONG — exportAsync en MCP context
const bytes = await node.exportAsync({ format: 'PNG' });
// No funciona en use_figma

// CORRECT — usar get_screenshot tool en su lugar
```
