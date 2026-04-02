---
name: variant-generator
description: Genera variantes de componentes en Figma a partir de props/enums del codigo (React, Vue, Svelte, Angular, etc.). Usa cuando se necesita crear variantes de un componente existente, mapear estados del codigo a Figma, o completar un component set con variantes faltantes.
triggers:
  - "genera variantes"
  - "crea variantes desde codigo"
  - "agrega estados al componente"
  - "generate variants"
  - "faltan variantes"
  - "component states"
tools:
  - use_figma
  - get_metadata
  - get_screenshot
  - get_design_context
  - search_design_system
---

# Variant Generator

Genera variantes de componentes Figma a partir de las props y enums definidos en codigo React.

## Proceso

### Paso 1: Analizar el componente en codigo

Leer el archivo del componente React y extraer:

```typescript
// Ejemplo: componente Button
interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';  // → Variant group "Type"
  size?: 'small' | 'middle' | 'large';                          // → Variant group "Size"
  danger?: boolean;                                              // → Variant group "Danger"
  disabled?: boolean;                                            // → Variant group "State"
  loading?: boolean;                                             // → Variant group "Loading"
}
```

### Paso 2: Mapear props a variant groups

| Prop Type | Figma Variant | Ejemplo |
|---|---|---|
| Union de strings | VARIANT property | `type: 'primary' \| 'default'` → Type=Primary, Type=Default |
| Boolean | BOOLEAN property o 2 variantes | `danger: true/false` → Danger=Yes/No |
| Enum | VARIANT property | `size: Size.SM \| Size.MD` → Size=SM, Size=MD |
| Opcional con default | Default variant | `size?: 'middle'` → default variant es Size=Middle |

### Paso 3: Calcular matriz de variantes

Para un Component Set, calcular todas las combinaciones necesarias:

```
Ejemplo minimo (priorizar las mas usadas):
- Type: primary, default (2)
- State: default, hover, disabled (3)
- Size: middle (1, solo default)
= 2 × 3 × 1 = 6 variantes

Ejemplo completo:
- Type: primary, default, dashed, text, link (5)
- State: default, hover, active, disabled, loading (5)
- Size: small, middle, large (3)
= 5 × 5 × 3 = 75 variantes (DEMASIADAS)
```

**Regla: Maximo 24 variantes por component set.** Si hay mas combinaciones, priorizar:
1. Estados mas usados (default, hover, disabled)
2. Tipos mas usados (primary, default)
3. Solo el tamano default (expandir despues si se necesita)

### Paso 4: Crear variantes en Figma

```javascript
// Para cada combinacion:
// 1. Clonar la variante base
// 2. Aplicar cambios visuales
// 3. Renombrar con formato "Prop1=Value1, Prop2=Value2"

const base = existingComponent; // Variante base existente
const clone = base.clone();
clone.name = "Type=Primary, State=Hover";

// Aplicar cambios visuales segun el estado
// Hover: bg mas oscuro
// Disabled: opacity 0.5
// Loading: agregar spinner
```

### Paso 5: Organizar como Component Set

```javascript
// via use_figma: si es un componente suelto, convertir a component set
// Usar figma.combineAsVariants() y luego configurar layout del set
```

### Paso 6: Registrar en libreria

Ejecutar `component-library-sync` para actualizar Design System.

## Mapeo visual por estado

### Botones

| Estado | Cambio visual |
|---|---|
| Default | Color base |
| Hover | Color 10% mas oscuro |
| Active/Pressed | Color 20% mas oscuro |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Spinner + texto "Loading..." |

### Inputs

| Estado | Cambio visual |
|---|---|
| Default | Border #D9D9D9 |
| Hover | Border Primary/6 |
| Focus | Border Primary/6 + shadow |
| Error | Border Dust Red/5 |
| Disabled | bg #F5F5F5, text #00000040 |

### Cards

| Estado | Cambio visual |
|---|---|
| Default | Shadow sm |
| Hover | Shadow md |
| Selected | Border Primary/6 |
| Disabled | Opacity 0.5 |

### Rows de tabla

| Estado | Cambio visual |
|---|---|
| Default | bg white |
| Hover | bg #FAFAFA |
| Selected | bg Primary/1 (#E6F7FF) |
| Disabled | text #00000040 |

## Naming de variantes

```
Formato: "Prop1=Value1, Prop2=Value2"

Bien:
  "Type=Primary, State=Default"
  "Type=Default, State=Hover"
  "Size=Small, State=Disabled"

Mal:
  "Variant2"
  "Property 1=Default"
  "hover state primary"
  "btn-primary-hover"
```

## Output esperado

```
## Variantes Generadas
- Componente: {nombre}
- Fuente: {archivo .tsx}
- Total variantes: {N}

## Props mapeados
| Prop | Tipo | Valores | Default |
|---|---|---|---|
| type | VARIANT | primary, default | default |
| state | VARIANT | default, hover, disabled | default |

## Variantes creadas
| # | Nombre | Cambios visuales |
|---|---|---|
| 1 | Type=Primary, State=Default | bg #1890FF, text white |
| 2 | Type=Primary, State=Hover | bg #40A9FF, text white |
| ... | ... | ... |

## Pendiente
- [ ] component-library-sync ejecutado
- [ ] code-connect-bridge actualizado
```
