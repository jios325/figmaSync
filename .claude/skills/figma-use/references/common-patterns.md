# Patrones Comunes del Plugin API

Codigo probado para operaciones frecuentes con `use_figma` o `figma_execute`.

## Estructura Basica de un Script

```javascript
// 1. Navegar a la pagina correcta
const page = figma.root.children.find(p => p.name === "Page Name");
if (page) await figma.setCurrentPageAsync(page);

// 2. Hacer UNA cosa
const frame = figma.createFrame();
frame.name = "My Frame";
frame.resize(400, 300);
frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

// 3. Retornar IDs
return { frameId: frame.id, pageName: page.name };
```

## Crear Frame con Auto Layout

```javascript
const container = figma.createFrame();
container.name = "Card";
container.layoutMode = "VERTICAL";
container.primaryAxisAlignItems = "MIN";
container.counterAxisAlignItems = "MIN";
container.paddingTop = container.paddingBottom = 16;
container.paddingLeft = container.paddingRight = 16;
container.itemSpacing = 8;
container.counterAxisSizingMode = "AUTO";  // hug width
container.primaryAxisSizingMode = "AUTO";  // hug height
container.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
container.cornerRadius = 8;

return { containerId: container.id };
```

## Crear Texto

```javascript
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

const title = figma.createText();
title.fontName = { family: "Inter", style: "Semi Bold" };
title.fontSize = 20;
title.characters = "Card Title";
title.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.15 } }];

const body = figma.createText();
body.fontName = { family: "Inter", style: "Regular" };
body.fontSize = 14;
body.characters = "Card description text goes here.";
body.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];

// Agregar a un container
const parent = await figma.getNodeByIdAsync("PARENT_ID");
parent.appendChild(title);
parent.appendChild(body);

return { titleId: title.id, bodyId: body.id };
```

## Crear Rectangulo con Color

```javascript
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

const rect = figma.createRectangle();
rect.name = "bg";
rect.resize(1440, 900);
rect.fills = [{ type: 'SOLID', color: hexToRgb("#F5F5F5") }];
rect.cornerRadius = 4;

return { rectId: rect.id };
```

## Importar y Usar Componente de Libreria

```javascript
// Requiere el key del componente (obtenido via search_design_system)
const component = await figma.importComponentByKeyAsync("COMPONENT_KEY");
const instance = component.createInstance();
instance.name = "Button Instance";

// Modificar propiedades del componente
const props = instance.componentProperties;
for (const [key, prop] of Object.entries(props)) {
  if (key.startsWith("Label")) {
    instance.setProperties({ [key]: "Click me" });
  }
}

return { instanceId: instance.id };
```

## Crear Coleccion de Variables

```javascript
// Idempotente — verificar si existe primero
let collection = figma.variables.getLocalVariableCollections()
  .find(c => c.name === "Primitives");

if (!collection) {
  collection = figma.variables.createVariableCollection("Primitives");
  collection.renameMode(collection.modes[0].modeId, "Default");
}

const modeId = collection.modes[0].modeId;

// Crear variable
const colorVar = figma.variables.createVariable("color/primary", collection, "COLOR");
colorVar.setValueForMode(modeId, { r: 0.09, g: 0.35, b: 1 });

return {
  collectionId: collection.id,
  variableId: colorVar.id,
  modeId: modeId
};
```

## Binding de Variable a Nodo

```javascript
const node = await figma.getNodeByIdAsync("NODE_ID");
const variable = await figma.variables.getVariableByIdAsync("VARIABLE_ID");

// Bind color fill
const fills = JSON.parse(JSON.stringify(node.fills));
fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
node.fills = fills;

return { success: true, nodeId: node.id };
```

## Crear Componente con Variantes

```javascript
// Crear componente base
const base = figma.createComponent();
base.name = "State=Default";
base.resize(120, 40);
base.layoutMode = "HORIZONTAL";
base.primaryAxisAlignItems = "CENTER";
base.counterAxisAlignItems = "CENTER";
base.fills = [{ type: 'SOLID', color: { r: 0.09, g: 0.35, b: 1 } }];
base.cornerRadius = 6;

// Crear variante hover
const hover = base.clone();
hover.name = "State=Hover";
const hoverFills = JSON.parse(JSON.stringify(hover.fills));
hoverFills[0].color = { r: 0.07, g: 0.28, b: 0.85 };
hover.fills = hoverFills;

// Combinar en component set
const componentSet = figma.combineAsVariants([base, hover], figma.currentPage);
componentSet.name = "Button";

return { componentSetId: componentSet.id };
```
