---
name: component-library-sync
description: Registra componentes nuevos en la pagina Design System de Figma y los organiza por categoria. Usa cuando se crea un componente nuevo que debe agregarse a la libreria local, o cuando hay componentes sueltos que deben organizarse.
triggers:
  - "agrega este componente a la libreria"
  - "registra componente"
  - "organiza design system"
  - "sync component library"
  - "nuevo componente para la libreria"
  - "component to design system"
tools:
  - use_figma
  - get_metadata
  - get_screenshot
  - get_design_context
  - search_design_system
---

# Component Library Sync

Registra, organiza y mantiene la libreria de componentes locales en la pagina "Design System" de Figma.

## Principio fundamental

> Todo componente creado durante el diseño de pantallas DEBE registrarse en la libreria local. Si no esta en Design System, no existe.

## Prerequisito

> Los tokens DEBEN estar aplicados ANTES de componentizar.
> Si el archivo no tiene variables de color aplicadas, ejecutar `/token-sync` primero.
> Componentes sin tokens = componentes que habra que re-hacer cuando se tokenice.

## Estructura de la pagina Design System (template)

```
Design System (pagina)
├── Seccion: Componentes Locales (SECTION frame)
│   ├── Categoría: Bars
│   │   └── {nombre} (COMPONENT_SET o COMPONENT)
│   ├── Categoría: Cards
│   │   └── {nombre} (COMPONENT_SET o COMPONENT)
│   ├── Categoría: Navigation
│   │   └── sidebar, menu, tabs, breadcrumbs...
│   ├── Categoría: Forms
│   │   └── input, select, checkbox, radio, switch...
│   ├── Categoría: Buttons
│   │   └── primary, secondary, icon buttons...
│   ├── Categoría: Layout
│   │   └── header, bg, divider, title...
│   └── Categoría: Modals
│       └── confirmation, form modals...
│
├── Componentes sueltos (mover a la seccion)
│
└── {Framework} Overrides (opcional)
    └── Componentes que extienden la libreria UI externa
```

**Nota:** Las categorias se adaptan al proyecto. Descubrir los componentes existentes y organizarlos por tipo, no por nombre de proyecto.

## Proceso: Registrar componente nuevo

### Paso 1: Verificar que no exista

```javascript
// Buscar en toda la pagina Design System
const designSystem = figma.root.children.find(p => p.name === 'Design System');
const existing = designSystem.findAll(n =>
  n.type === 'COMPONENT' && n.name.toLowerCase().includes(searchTerm)
);
```

Si ya existe → NO duplicar. Informar al usuario.

### Paso 2: Determinar categoría

| Si el componente es... | Categoría |
|---|---|
| Row/fila de tabla con variantes | Bars |
| Tarjeta con contenido | Cards |
| Menu, sidebar, tab, breadcrumb | Navigation |
| Input, select, checkbox, radio, switch | Forms |
| Botón (cualquier tipo) | Buttons |
| Header, footer, divider, background | Layout |
| Diálogo/overlay | Modals |
| Otro | Misc (crear nueva categoría) |

### Paso 3: Convertir a COMPONENT si es FRAME

```javascript
// Si el elemento es un FRAME, convertirlo a COMPONENT
if (node.type === 'FRAME') {
  // En Figma Plugin API: usar figma.createComponent() y copiar children
  const component = figma.createComponent();
  component.name = node.name;
  component.resize(node.width, node.height);
  // Copiar propiedades visuales
  component.fills = node.fills;
  component.strokes = node.strokes;
  component.cornerRadius = node.cornerRadius;
  // Mover children
  for (const child of [...node.children]) {
    component.appendChild(child);
  }
  // Reemplazar en el árbol
  node.parent.insertChild(node.parent.children.indexOf(node), component);
  node.remove();
}
```

### Paso 4: Mover a la categoría correcta

1. Encontrar la sección "Componentes Locales" en Design System
2. Posicionar junto a componentes de la misma categoría
3. Alinear con gap consistente (40px horizontal, 60px vertical entre categorías)

### Paso 5: Nombrar correctamente

```
Convención de naming:
  - Componentes simples: kebab-case → "list-item", "product-card"
  - Component sets: kebab-case → "primary button" con variantes
  - Variantes: "Property=Value" → "State=Default", "State=Hover", "Size=Small"

NO usar:
  - "Variant2", "Variant3" → usar nombres semánticos
  - "Property 1=Default" → renombrar la propiedad
  - Nombres genéricos: "Group 127", "Frame 159"
```

### Paso 6: Agregar propiedades de componente

Si el componente tiene estados o variantes:

```javascript
// via use_figma: agregar propiedades de componente
// Usar figma.variables.* o component.addComponentProperty() API
```

### Paso 7: Documentar

Actualizar el inventario del componente:

```markdown
| Componente | Tipo | Variantes | Categoría | Node ID |
|---|---|---|---|---|
| {nombre} | COMPONENT/COMPONENT_SET | {N} | {categoría} | {id} |
```

## Proceso: Organizar Design System completo

### Layout de la página

```
Ancho total: 6000px (expandible)
Gap entre categorías: 200px vertical
Gap entre componentes: 80px horizontal, 40px vertical

Estructura visual:
┌─────────────────────────────────────────────────┐
│ TÍTULO: "Componentes Locales"  (Section label)  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ── Bars ────────────────────────────────────    │
│  [bar entret.] [bar restaur.] [bar serv.]        │
│  [bar amenid.] [bar promos ]                     │
│                                                  │
│  ── Cards ───────────────────────────────────    │
│  [card hotel] [card fotos] [dsct hotels]         │
│  [foto-drag ]                                    │
│                                                  │
│  ── Navigation ──────────────────────────────    │
│  [side bar] [item] [menu interno]                │
│  [menu serv] [hoteles tab]                       │
│                                                  │
│  ── Forms ───────────────────────────────────    │
│  [input] [select] [checkbox] [tab seo]           │
│                                                  │
│  ── Buttons ─────────────────────────────────    │
│  [primary] [secondary] [secondary blue]          │
│                                                  │
│  ── Layout ──────────────────────────────────    │
│  [base bar] [bg] [divisor] [titulo]              │
│                                                  │
│  ── Modals ──────────────────────────────────    │
│  [modal amenid.] [modal preguntas]               │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Auto-organización

```javascript
// Algoritmo de posicionamiento
let currentX = sectionX + 40; // padding izquierdo
let currentY = sectionY + 80; // debajo del título de categoría
const maxWidth = 5000;
const hGap = 80;
const vGap = 40;
const categoryGap = 200;

for (const category of categories) {
  // Título de categoría (texto)
  createCategoryLabel(category.name, currentX, currentY);
  currentY += 40;

  let rowStartY = currentY;
  let rowMaxHeight = 0;

  for (const component of category.components) {
    if (currentX + component.width > maxWidth) {
      // Nueva fila
      currentX = sectionX + 40;
      currentY += rowMaxHeight + vGap;
      rowMaxHeight = 0;
    }

    component.x = currentX;
    component.y = currentY;
    currentX += component.width + hGap;
    rowMaxHeight = Math.max(rowMaxHeight, component.height);
  }

  currentY += rowMaxHeight + categoryGap;
  currentX = sectionX + 40;
}
```

## Proceso: Mover componentes sueltos a la sección

Si hay componentes fuera de "Componentes Locales" en la página Design System:

1. Identificarlos via `use_figma` (findAll type=COMPONENT fuera de la sección)
2. Clasificarlos por categoría
3. Moverlos dentro de la sección
4. Posicionar en la categoría correcta
5. Actualizar el tamaño de la sección para que contenga todo

## Relación con otros skills

| Cuándo | Skill relacionado |
|---|---|
| Se crea pantalla nueva con componente nuevo | `screen-creator` → luego `component-library-sync` |
| Se detecta componente sin registrar | `design-normalizer` → luego `component-library-sync` |
| Se necesita mapear componente a código | `component-library-sync` → luego `code-connect-bridge` |
| Se crean variantes desde código | `variant-generator` → luego `component-library-sync` |

## Anti-patrones

1. **NO duplicar componentes de Ant Design** — si Ant Design ya tiene Button, Switch, Input, NO crear versión local
2. **NO crear componentes sin variantes** — si tiene estados, crear COMPONENT_SET
3. **NO dejar frames como frames** — todo lo reutilizable debe ser COMPONENT
4. **NO crear fuera de Design System** — el componente se crea donde se necesita, pero SIEMPRE se registra en Design System
5. **NO nombrar con IDs** — nunca "Group 127" o "Frame 159"

## Output esperado

```
## Componente Registrado
- Nombre: {nombre}
- Tipo: COMPONENT / COMPONENT_SET
- Variantes: {lista de variantes}
- Categoría: {categoría}
- Node ID: {id}
- Página: Design System

## Posición
- Dentro de: Componentes Locales > {categoría}
- Coordenadas: x={x}, y={y}

## Acciones realizadas
- [ ] Convertido de FRAME a COMPONENT (si aplica)
- [ ] Nombrado correctamente
- [ ] Posicionado en categoría
- [ ] Propiedades de componente agregadas
- [ ] Sección expandida para contener nuevo componente
- [ ] Screenshot de validación tomado
```
