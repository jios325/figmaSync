# Patrones de Variables del Plugin API

## Crear Coleccion con Modes

```javascript
const collection = figma.variables.createVariableCollection("Semantic");
// Ya tiene un mode por defecto
collection.renameMode(collection.modes[0].modeId, "Light");
// Agregar Dark mode (max 4 en Professional, ilimitado en Enterprise)
const darkModeId = collection.addMode("Dark");

return {
  collectionId: collection.id,
  lightModeId: collection.modes[0].modeId,
  darkModeId: darkModeId
};
```

## Tipos de Variables

```javascript
const modeId = collection.modes[0].modeId;

// COLOR
const color = figma.variables.createVariable("color/primary", collection, "COLOR");
color.setValueForMode(modeId, { r: 0.09, g: 0.35, b: 1 });

// FLOAT (spacing, sizing, radius)
const spacing = figma.variables.createVariable("spacing/md", collection, "FLOAT");
spacing.setValueForMode(modeId, 16);

// STRING
const fontFamily = figma.variables.createVariable("font/family", collection, "STRING");
fontFamily.setValueForMode(modeId, "Inter");

// BOOLEAN
const isVisible = figma.variables.createVariable("show/header", collection, "BOOLEAN");
isVisible.setValueForMode(modeId, true);
```

## Aliases (Variable que referencia otra variable)

```javascript
// Primitiva
const blue500 = figma.variables.createVariable("color/blue/500", primitivesCollection, "COLOR");
blue500.setValueForMode(primModeId, { r: 0.09, g: 0.35, b: 1 });

// Semantica que apunta a la primitiva
const actionPrimary = figma.variables.createVariable("color/action/primary", semanticCollection, "COLOR");
actionPrimary.setValueForMode(semModeId, {
  type: 'VARIABLE_ALIAS',
  id: blue500.id
});
```

## Scopes (Donde se puede usar la variable)

```javascript
// Scopes de COLOR:
variable.scopes = ["FRAME_FILL"];        // Solo fill de frames
variable.scopes = ["SHAPE_FILL"];        // Solo fill de shapes
variable.scopes = ["TEXT_FILL"];          // Solo fill de texto
variable.scopes = ["STROKE_COLOR"];      // Solo strokes
variable.scopes = ["ALL_FILLS"];         // Todos los fills
variable.scopes = ["ALL_SCOPES"];        // Todo (NO recomendado)

// Scopes de FLOAT:
variable.scopes = ["CORNER_RADIUS"];     // Solo border radius
variable.scopes = ["GAP"];              // Solo gap en auto layout
variable.scopes = ["WIDTH_HEIGHT"];      // Solo width/height
variable.scopes = ["FONT_SIZE"];         // Solo font size
variable.scopes = ["FONT_WEIGHT"];       // Solo font weight
variable.scopes = ["LINE_HEIGHT"];       // Solo line height
variable.scopes = ["LETTER_SPACING"];    // Solo letter spacing
variable.scopes = ["PARAGRAPH_SPACING"]; // Solo paragraph spacing
variable.scopes = ["PARAGRAPH_INDENT"];  // Solo paragraph indent
variable.scopes = ["OPACITY"];           // Solo opacity
```

## Binding de Variables a Nodos

```javascript
// Bind fill color
const fills = JSON.parse(JSON.stringify(node.fills));
fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
node.fills = fills;

// Bind stroke color
const strokes = JSON.parse(JSON.stringify(node.strokes));
strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', variable);
node.strokes = strokes;

// Bind spacing (padding, gap, radius, sizing)
node.setBoundVariable('paddingTop', spacingVariable);
node.setBoundVariable('paddingBottom', spacingVariable);
node.setBoundVariable('itemSpacing', gapVariable);
node.setBoundVariable('cornerRadius', radiusVariable);

// Bind font size (solo TEXT nodes)
node.setBoundVariable('fontSize', fontSizeVariable);
```

## Descubrir Variables Existentes

```javascript
// Listar colecciones locales
const collections = figma.variables.getLocalVariableCollections();
const summary = collections.map(c => ({
  id: c.id,
  name: c.name,
  modes: c.modes.map(m => m.name),
  variableIds: c.variableIds
}));

// Listar variables de una coleccion
const variables = figma.variables.getLocalVariables("COLOR");
const colorVars = variables.map(v => ({
  id: v.id,
  name: v.name,
  collectionId: v.variableCollectionId
}));

return { collections: summary, colorVariables: colorVars };
```

## Code Syntax (para Code Connect)

```javascript
// Configurar como se muestra en Dev Mode
variable.setVariableCodeSyntax("WEB", "var(--color-primary)");     // WEB requiere var() wrapper
variable.setVariableCodeSyntax("ANDROID", "colorPrimary");          // ANDROID usa camelCase
variable.setVariableCodeSyntax("iOS", "Color.primary");             // iOS usa dot-notation
```

## Importar Variables de Libreria

```javascript
// Importar por key (obtenido via search_design_system o get_variable_defs)
const importedVar = await figma.variables.importVariableByKeyAsync("VARIABLE_KEY");
// Ahora se puede usar para binding como cualquier variable local
```
