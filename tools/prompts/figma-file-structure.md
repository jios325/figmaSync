# Template: Estructura de Archivo Figma AI-Ready

> Guia para organizar archivos de Figma de forma que los agentes AI
> puedan leerlos correctamente y generar codigo de calidad.

## Estructura de Pages

```
📄 Cover (portada del proyecto)
📄 Design System
   ├── Colors (palette + semantic tokens)
   ├── Typography (type scale)
   ├── Spacing (scale de espaciado)
   ├── Icons (icon set)
   └── Components (biblioteca de componentes)
📄 Desktop
   ├── Home
   ├── Hotel Detail
   ├── Room Detail
   ├── Booking Flow
   ├── Contact
   └── ...
📄 Mobile
   ├── Home
   ├── Hotel Detail
   └── ...
📄 Flows (user journeys completos)
📄 Archive (versiones viejas, marcadas como archive)
```

## Naming de Layers

### Reglas

| Tipo | Convencion | Ejemplo | Anti-ejemplo |
|---|---|---|---|
| Pages | PascalCase descriptivo | "Hotel Detail" | "Page 3" |
| Frames (screens) | Seccion/Variante | "Home/Desktop" | "Frame 145" |
| Components | PascalCase | "BookingCard" | "card copy 2" |
| Variantes | Estado/Tamano | "Button/Primary/Hover" | "button2" |
| Groups | Descripcion funcional | "Hero Section" | "Group 67" |
| Icons | kebab-case | "icon-arrow-right" | "Vector 12" |
| Images | kebab-case descriptivo | "hero-hotel-cancun" | "Image" |

### Jerarquia de naming para componentes

```
ComponentName/
├── Variant1/
│   ├── State1 (default, hover, active, disabled)
│   └── State2
└── Variant2/
    ├── State1
    └── State2

Ejemplo:
Button/
├── Primary/
│   ├── Default
│   ├── Hover
│   ├── Active
│   ├── Disabled
│   └── Loading
├── Secondary/
│   └── ...
└── Ghost/
    └── ...
```

## Variables y Tokens

### Estructura de jerarquia

```
Primitive Tokens (base):
  color/
    blue/50: #EFF6FF
    blue/100: #DBEAFE
    blue/500: #3B82F6
    blue/700: #1D4ED8
    blue/900: #1E3A5F
  gray/
    50: #F9FAFB
    ...

Semantic Tokens (proposito):
  color/
    primary: → color/blue/700
    secondary: → color/gray/600
    background/default: → color/gray/50
    background/elevated: → #FFFFFF
    text/primary: → color/gray/900
    text/secondary: → color/gray/600
    text/inverse: → #FFFFFF
    error: → color/red/600
    success: → color/green/600
    warning: → color/amber/500

  spacing/
    xs: 4px
    sm: 8px
    md: 16px
    lg: 24px
    xl: 32px
    2xl: 48px
    3xl: 64px

  typography/
    heading/
      h1: { family: Inter, size: 36, weight: 700, lineHeight: 44 }
      h2: { family: Inter, size: 30, weight: 700, lineHeight: 38 }
      h3: { family: Inter, size: 24, weight: 600, lineHeight: 32 }
    body/
      lg: { family: Inter, size: 18, weight: 400, lineHeight: 28 }
      md: { family: Inter, size: 16, weight: 400, lineHeight: 24 }
      sm: { family: Inter, size: 14, weight: 400, lineHeight: 20 }

  radius/
    sm: 4px
    md: 8px
    lg: 12px
    xl: 16px
    full: 9999px

Component Tokens (especificos):
  button/
    primary/bg: → color/primary
    primary/text: → color/text/inverse
    primary/border: → transparent
    secondary/bg: → transparent
    secondary/text: → color/primary
    secondary/border: → color/primary
```

## Auto Layout

### Obligatorio en:
- Todos los componentes
- Todas las secciones dentro de frames
- Headers, footers, navbars
- Cards, forms, modals
- Listas y grids

### Configuracion recomendada

```
Frame de pagina:
  Direction: Vertical
  Gap: 0 (secciones pegadas)
  Padding: 0
  Width: Fixed (1440 desktop, 375 mobile)
  Height: Hug contents

Seccion:
  Direction: Vertical
  Gap: spacing/lg (24px)
  Padding: spacing/xl (32px) horizontal, spacing/2xl (48px) vertical
  Width: Fill container
  Height: Hug contents

Grid de cards:
  Direction: Horizontal (wrap)
  Gap: spacing/md (16px)
  Width: Fill container

Card:
  Direction: Vertical
  Gap: spacing/sm (8px)
  Padding: spacing/md (16px)
  Width: Fill container (en grid)
  Border Radius: radius/lg (12px)
```

## Componentes: Checklist de Calidad

Para que un componente sea "AI-ready":

- [ ] **Reutilizable:** Marcado como component en Figma (no frame suelto)
- [ ] **Nombrado:** PascalCase descriptivo
- [ ] **Auto Layout:** Aplicado con direction, gap, padding
- [ ] **Variables:** Usa variables de color, no hex hardcodeados
- [ ] **Variantes de estado:** Default, Hover, Active, Disabled, Loading
- [ ] **Variantes de tamano:** SM, MD, LG (si aplica)
- [ ] **Responsive:** Desktop + Mobile (si aplica)
- [ ] **Slots:** Areas de contenido dinamico bien definidas
- [ ] **Constraints:** Min/max width/height donde aplique
- [ ] **Descripcion:** Description field con uso y notas

## Annotations para AI

Usar Figma comments para:
- Explicar comportamiento interactivo (hover effects, animaciones)
- Indicar condicionales ("Este badge solo aparece si has_promotion = true")
- Notar responsive behavior ("En mobile, esta grid pasa de 3 cols a 1")
- Indicar datos dinamicos ("Este texto viene del API, campo: hotel.name")
- Marcar componentes que ya estan implementados vs pendientes

## Anti-patrones a Evitar

| Anti-patron | Problema | Solucion |
|---|---|---|
| Colores hex sueltos | AI no sabe que token usar | Crear variables |
| Frames sin Auto Layout | Codigo usa posicionamiento absoluto | Aplicar Auto Layout |
| "Frame 123" como nombre | AI no entiende la semantica | Nombrar descriptivamente |
| Componente copiado (no instancia) | Cambios no se propagan | Crear component set |
| Text con estilo manual | Tipografia inconsistente | Usar text styles/variables |
| 10 niveles de anidacion | Codigo innecesariamente complejo | Simplificar estructura |
| Artboard sin agrupacion | AI no sabe que es seccion vs detalle | Agrupar por seccion |
