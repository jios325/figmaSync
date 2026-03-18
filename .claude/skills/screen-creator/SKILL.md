---
name: screen-creator
description: Crea nuevas pantallas en Figma siguiendo los patrones establecidos del proyecto. Usa cuando el usuario pide crear, agregar, o diseñar una pantalla, vista, o página nueva en Figma.
triggers:
  - "crea una pantalla"
  - "nueva pantalla"
  - "agrega una vista"
  - "diseña la página de"
  - "create screen"
  - "new figma screen"
  - "falta la pantalla de"
tools:
  - figma_execute
  - figma_create_child
  - figma_instantiate_component
  - figma_clone_node
  - figma_set_text
  - figma_set_fills
  - figma_rename_node
  - figma_move_node
  - figma_resize_node
  - figma_capture_screenshot
  - figma_get_selection
  - figma_search_components
---

# Screen Creator

Crea pantallas nuevas en Figma que siguen exactamente los patrones visuales y estructurales del proyecto.

## Principio fundamental

> Toda pantalla nueva debe ser INDISTINGUIBLE de las existentes. Mismo sidebar, mismo header, mismo spacing, mismos componentes.

## Pre-requisitos

Antes de crear cualquier pantalla:

1. **Identificar la página destino** en Figma
2. **Encontrar una pantalla hermana** — la más parecida a lo que se va a crear
3. **Leer la estructura de la pantalla hermana** para replicar el layout exacto

## Discovery Phase — Layout Shell

Before creating any screen, discover the project's layout by scanning an existing screen:

```javascript
// Run via figma_execute on the target page
const page = figma.currentPage;
const reference = page.children.find(c => c.type === 'FRAME');
const shell = {
  width: reference.width,
  height: reference.height,
  children: reference.children.map(c => ({
    name: c.name, type: c.type,
    x: c.x, y: c.y,
    width: c.width, height: c.height,
    fills: c.fills
  }))
};
return JSON.stringify(shell, null, 2);
```

Record discovered values:
- **Frame width**: `{discovered}` (common: 1440, 1920, 1280)
- **Header**: name=`{name}`, height=`{h}`, fill=`{color}`
- **Sidebar** (if present): name=`{name}`, width=`{w}`
- **Content area**: name=`{name}`, fill=`{color}`, padding=`{px}`
- **Breadcrumb/navigation**: position and style
- **Title**: font size, color, position

## Proceso de creación

### Paso 1: Clonar pantalla hermana

```
SIEMPRE clonar una pantalla existente como base.
NUNCA crear una pantalla desde cero.
```

1. Identificar la pantalla más similar al objetivo
2. Usar `figma_clone_node` para duplicar
3. Renombrar con convención: `{sección} / {acción}`
   - Ejemplos: `Users / Lista`, `Roles / Editar Permisos`, `Bodas / Crear Item`

### Paso 2: Ajustar contenido

1. **Título**: Cambiar el texto del H5 del header
2. **Breadcrumb**: Actualizar la ruta (ej: `Administración / Roles / Editor`)
3. **Sidebar**: Verificar que el item activo sea correcto
4. **Content**: Reemplazar el contenido específico

### Paso 3: Poblar con datos reales

Si hay acceso a la BD:
```sql
-- Leer datos reales para popular la pantalla
SELECT * FROM {tabla} LIMIT 5;
```

Usar los datos reales en los textos de la pantalla para que sea una representación fiel.

### Paso 4: Posicionar en la página

1. Obtener posición del último artboard en la página destino
2. Colocar el nuevo frame a la derecha con gap de 100px
3. Si es una fila nueva, colocar debajo con gap de 200px

```javascript
// Patrón de posicionamiento
const lastFrame = page.children[page.children.length - 1];
newFrame.x = lastFrame.x + lastFrame.width + 100;
newFrame.y = lastFrame.y;

// Si excede 5000px de ancho, nueva fila
if (newFrame.x + newFrame.width > 5000) {
  newFrame.x = page.children[0].x;
  newFrame.y = lastFrame.y + lastFrame.height + 200;
}
```

### Paso 5: Validar

1. Tomar screenshot con `figma_capture_screenshot`
2. Verificar:
   - [ ] Sidebar presente y con item activo correcto
   - [ ] Header con logo y usuario
   - [ ] Breadcrumb actualizado
   - [ ] Título correcto
   - [ ] Content area con padding correcto
   - [ ] Datos reales (no lorem ipsum)
   - [ ] Dimensiones 1440xN (width fijo)

## Tipos de pantalla

### Lista (CRUD Read)
```
Content:
  - Sección título + contador (ej: "Gestión de Usuarios · 3 Administradores · 1 Editor")
  - Search bar (opcional)
  - Table con columnas
  - Pagination (si aplica)
  - Acciones por fila (edit, delete, toggle)
```

### Formulario (CRUD Create/Edit)
```
Content:
  - Form title
  - Tabs (si tiene secciones: General, SEO, Media)
  - Form fields en grid de 2 columnas
  - Labels arriba de cada field
  - Botones de acción (Guardar, Cancelar) al final
```

### Vista detalle
```
Content:
  - Panel con información resumida
  - Tabs para subsecciones
  - Acciones (Editar, Eliminar)
```

### Dashboard / Cards
```
Content:
  - Cards en grid
  - Cada card con título, descripción, métricas
  - Toggle/switch por card
```

## Convenciones de naming

### Frames (artboards)
```
{Sección} / {Vista}
Ejemplos:
  Users / Lista
  Users / Crear
  Roles / Lista
  Roles / Editar Permisos
  Hotel / Habitaciones
  Hotel / Habitaciones Agregar
  Promociones / Internas Lista
  Promociones / Internas Editar
```

### Layers internos
```
base bar          → header
sidebar           → navegación lateral
bg                → fondo del content area
content           → wrapper del contenido
table-header      → header de tabla
table-row-{n}     → filas de tabla
form-field-{name} → campos de formulario
action-buttons    → grupo de botones de acción
```

## Componentes reutilizables

### Instanciar desde librería local
Antes de crear un elemento, verificar si existe como componente:

```javascript
// Buscar componente existente
const components = await figma.currentPage.findAllWithCriteria({types: ['COMPONENT']});
const existing = components.find(c => c.name === 'button primary');
if (existing) {
  const instance = existing.createInstance();
  // posicionar y configurar
}
```

### Si NO existe → crear Y registrar
Si necesitas un componente que no existe:

1. Crearlo como COMPONENT (no como frame)
2. Nombrarlo siguiendo convención
3. **Ejecutar skill `component-library-sync`** para agregarlo a Design System
4. Documentar en el reporte de creación

## Output esperado

Al finalizar, reportar:

```
## Pantalla Creada
- Nombre: {nombre}
- Página: {página destino}
- Clonada de: {pantalla hermana}
- Node ID: {id}
- Dimensiones: {w}x{h}

## Cambios realizados
- Título: {nuevo título}
- Breadcrumb: {nueva ruta}
- Content: {descripción del contenido}
- Datos: {fuente de datos usada}

## Componentes
- Reutilizados: {lista}
- Nuevos creados: {lista} → pendiente component-library-sync

## Validación
- [ ] Screenshot tomado
- [ ] Layout consistente con hermanas
- [ ] Datos reales poblados
- [ ] Naming correcto
```

## Errores comunes

1. **NO crear frames de 0** — siempre clonar una existente
2. **NO hardcodear textos** — usar datos reales de la BD cuando sea posible
3. **NO inventar colores** — usar solo tokens existentes del proyecto
4. **NO olvidar el sidebar** — toda pantalla debe tener sidebar + header
5. **NO dejar "Property 1=Default"** — renombrar variantes con nombres semánticos
6. **NO crear componentes sin registrarlos** — siempre ejecutar component-library-sync después
