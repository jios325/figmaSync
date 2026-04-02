# Patrones de Componentes del Plugin API

## Crear Componente Simple

```javascript
const component = figma.createComponent();
component.name = "Badge";
component.resize(80, 28);
component.layoutMode = "HORIZONTAL";
component.primaryAxisAlignItems = "CENTER";
component.counterAxisAlignItems = "CENTER";
component.paddingLeft = component.paddingRight = 8;
component.paddingTop = component.paddingBottom = 4;
component.cornerRadius = 14;
component.fills = [{ type: 'SOLID', color: { r: 0.09, g: 0.35, b: 1 } }];

await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
const label = figma.createText();
label.fontName = { family: "Inter", style: "Semi Bold" };
label.fontSize = 12;
label.characters = "Badge";
label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
component.appendChild(label);

return { componentId: component.id };
```

## Crear Component Set con Variantes

```javascript
// Crear variantes como componentes individuales
const defaultComp = figma.createComponent();
defaultComp.name = "Size=Medium, State=Default";
// ... configurar visual

const hoverComp = figma.createComponent();
hoverComp.name = "Size=Medium, State=Hover";
// ... configurar visual (mas oscuro)

const smallComp = figma.createComponent();
smallComp.name = "Size=Small, State=Default";
// ... configurar visual (mas chico)

// Combinar en component set
const componentSet = figma.combineAsVariants(
  [defaultComp, hoverComp, smallComp],
  figma.currentPage
);
componentSet.name = "Button";

return { componentSetId: componentSet.id };
```

## Component Properties

```javascript
// Agregar propiedad TEXT (editable en instancias)
component.addComponentProperty("Label", "TEXT", "Button Text");

// Agregar propiedad BOOLEAN (toggle)
component.addComponentProperty("Show Icon", "BOOLEAN", true);

// Agregar propiedad VARIANT (solo en component sets)
// Se crean automaticamente al combinar variantes con "Prop=Value" naming

// Agregar propiedad INSTANCE_SWAP
component.addComponentProperty("Icon", "INSTANCE_SWAP", "");
```

## Vincular Propiedades a Nodos Descendientes

```javascript
// Vincular TEXT property a un text node
const textNode = component.findOne(n => n.type === "TEXT" && n.name === "label");
if (textNode) {
  // Obtener la key de la propiedad
  const props = component.componentPropertyDefinitions;
  for (const [key, def] of Object.entries(props)) {
    if (def.type === "TEXT" && key.startsWith("Label")) {
      textNode.componentPropertyReferences = {
        ...textNode.componentPropertyReferences,
        characters: key
      };
    }
  }
}

// Vincular BOOLEAN property a visibilidad
const iconNode = component.findOne(n => n.name === "icon");
if (iconNode) {
  for (const [key, def] of Object.entries(component.componentPropertyDefinitions)) {
    if (def.type === "BOOLEAN" && key.startsWith("Show Icon")) {
      iconNode.componentPropertyReferences = {
        ...iconNode.componentPropertyReferences,
        visible: key
      };
    }
  }
}
```

## Instanciar y Modificar

```javascript
// Instanciar componente local
const instance = component.createInstance();

// Instanciar componente de libreria
const importedComponent = await figma.importComponentByKeyAsync("COMPONENT_KEY");
const instance = importedComponent.createInstance();

// Modificar propiedades
const props = instance.componentProperties;
for (const [key, prop] of Object.entries(props)) {
  if (key.startsWith("Label") && prop.type === "TEXT") {
    instance.setProperties({ [key]: "New Label" });
  }
  if (key.startsWith("Show Icon") && prop.type === "BOOLEAN") {
    instance.setProperties({ [key]: false });
  }
}
```

## Descubrir Componentes Existentes

```javascript
// Buscar componentes locales
const components = figma.root.findAllWithCriteria({
  types: ['COMPONENT', 'COMPONENT_SET']
});

const summary = components.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  key: c.type === 'COMPONENT' ? c.key : undefined,
  page: c.parent?.parent?.name || c.parent?.name
}));

return { components: summary };
```

## Inspeccionar Component Set

```javascript
const componentSet = await figma.getNodeByIdAsync("COMPONENT_SET_ID");
if (componentSet.type !== 'COMPONENT_SET') return { error: "Not a component set" };

// Listar variantes
const variants = componentSet.children.map(v => ({
  id: v.id,
  name: v.name,
  properties: v.variantProperties
}));

// Listar properties
const propDefs = componentSet.componentPropertyDefinitions;

return {
  name: componentSet.name,
  variantCount: variants.length,
  variants: variants,
  propertyDefinitions: Object.entries(propDefs).map(([key, def]) => ({
    key, type: def.type, defaultValue: def.defaultValue
  }))
};
```
