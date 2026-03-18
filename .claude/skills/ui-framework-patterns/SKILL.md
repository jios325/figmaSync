---
name: ui-framework-patterns
description: Patrones CRUD genericos para cualquier UI framework (Ant Design, Material UI, Shadcn, Tailwind, etc.). Define estructuras de pantallas lista, formulario, dashboard, y modal. Usa cuando se disenan pantallas con tablas, formularios, modales, o patrones CRUD.
triggers:
  - "patron de pantalla"
  - "screen pattern"
  - "tabla crud"
  - "formulario crud"
  - "modal pattern"
  - "crud pattern"
  - "list screen"
  - "form screen"
  - "dashboard pattern"
---

# UI Framework Patterns

Patrones de diseño CRUD genericos. Se adaptan al framework UI del proyecto.

## Discovery Phase

Before applying patterns, identify the project's UI framework:

### 1. Read Project CLAUDE.md

Look for: framework name, component library, CSS approach.

### 2. Identify Component Source

| Framework | How to detect | Component source |
|---|---|---|
| Ant Design | `antd` in package.json | Ant Design Figma library |
| Material UI | `@mui/material` in package.json | MUI Figma kit |
| Shadcn/ui | `components/ui/` directory | Local components |
| Tailwind | `tailwindcss` in package.json | Custom components |
| Chakra UI | `@chakra-ui/react` in package.json | Chakra Figma kit |
| Bootstrap | `bootstrap` in package.json | Bootstrap Figma kit |

### 3. Determine: Library vs Local

| Rule | Action |
|---|---|
| Component exists in UI framework library | Use library instance in Figma (Button, Input, Table, Modal, etc.) |
| Component is business-specific | Create as local component (custom data rows, domain cards, etc.) |
| Component extends a library component | Use library instance + overrides |

## Patrones de pantalla CRUD

### Pattern: Lista (Read)

```
┌─ Header ─────────────────────────────────────────┐
├─ Sidebar ─┬──────────────────────────────────────┤
│           │ Breadcrumb (right)                    │
│           │ Titulo H5                             │
│           │──────────────────────────────────────│
│           │ bg #F5F5F5                            │
│           │ ┌─ Section Title ──────────────────┐  │
│           │ │ "Gestion de X"                   │  │
│           │ │ Subtitulo: contadores            │  │
│           │ └──────────────────────────────────┘  │
│           │ ┌─ Ant Table ──────────────────────┐  │
│           │ │ Header: col1 | col2 | Acciones   │  │
│           │ │ Row 1: data | data | ✏️ 🗑️ 🔄    │  │
│           │ │ Row 2: data | data | ✏️ 🗑️ 🔄    │  │
│           │ │ Row 3: data | data | ✏️ 🗑️ 🔄    │  │
│           │ └──────────────────────────────────┘  │
│           │ [Ant Pagination]                      │
└───────────┴──────────────────────────────────────┘

Acciones por fila:
- Toggle Switch (activar/desactivar)
- Edit icon (lapiz) → navega a editar
- Delete icon (basura) → modal confirmacion
```

### Pattern: Formulario (Create/Edit)

```
┌─ Header ─────────────────────────────────────────┐
├─ Sidebar ─┬──────────────────────────────────────┤
│           │ Breadcrumb                            │
│           │ Titulo H5                             │
│           │──────────────────────────────────────│
│           │ bg #F5F5F5                            │
│           │ ┌─ Ant Tabs ──────────────────────┐   │
│           │ │ General | SEO | Media           │   │
│           │ └─────────────────────────────────┘   │
│           │ ┌─ Form (2 cols) ─────────────────┐   │
│           │ │ Label        | Label             │   │
│           │ │ [Input]      | [Input]           │   │
│           │ │                                  │   │
│           │ │ Label        | Label             │   │
│           │ │ [Select]     | [DatePicker]      │   │
│           │ │                                  │   │
│           │ │ Label (full width)               │   │
│           │ │ [TextArea]                       │   │
│           │ │                                  │   │
│           │ │ [Guardar] [Cancelar]             │   │
│           │ └─────────────────────────────────┘   │
└───────────┴──────────────────────────────────────┘

Form grid:
- 2 columnas con gap de 24px
- Labels arriba de cada campo
- Campos full-width cuando es textarea o rich editor
- Botones al final, alineados a la izquierda
```

### Pattern: Dashboard / Cards

```
┌─ Header ─────────────────────────────────────────┐
├─ Sidebar ─┬──────────────────────────────────────┤
│           │ Breadcrumb                            │
│           │ Titulo H5                             │
│           │──────────────────────────────────────│
│           │ bg #F5F5F5                            │
│           │ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│           │ │ Card 1  │ │ Card 2  │ │ Card 3  │  │
│           │ │ Titulo  │ │ Titulo  │ │ Titulo  │  │
│           │ │ Sub     │ │ Sub     │ │ Sub     │  │
│           │ │ [ON/OFF]│ │ [ON/OFF]│ │ [ON/OFF]│  │
│           │ └─────────┘ └─────────┘ └─────────┘  │
│           │ ┌─────────┐ ┌─────────┐              │
│           │ │ Card 4  │ │ Card 5  │              │
│           │ └─────────┘ └─────────┘              │
└───────────┴──────────────────────────────────────┘

Cards grid:
- 3 columnas max en 1229px content
- Gap: 16px
- Card width: ~380px
- Card: bg white, border-radius 4px, padding 16px
```

### Pattern: Modal de Confirmacion

```
┌─────────────────────────────────────┐
│ ⚠️ Confirmar eliminacion            │
│                                     │
│ ¿Estas seguro de eliminar "X"?     │
│ Esta accion no se puede deshacer.   │
│                                     │
│              [Cancelar] [Eliminar]   │
└─────────────────────────────────────┘

- Width: 416px (Ant Design default)
- Icon: ExclamationCircle (warning yellow)
- Boton peligro: type=primary danger
```

### Pattern: Modal de Formulario

```
┌─────────────────────────────────────────┐
│ Crear nuevo X                      [X]  │
│─────────────────────────────────────────│
│                                         │
│ Label                                   │
│ [Input                              ]   │
│                                         │
│ Label                                   │
│ [Select                        ▾   ]   │
│                                         │
│ Label                                   │
│ [TextArea                           ]   │
│                                         │
│─────────────────────────────────────────│
│                    [Cancelar] [Guardar]  │
└─────────────────────────────────────────┘

- Width: 520px o 720px segun complejidad
- Footer con divider
- Botones a la derecha
```

## Campos bilingues

El CMS maneja contenido en espanol e ingles. Patron:

```
Label (ES)                    | Label (EN)
[Input valor espanol      ]   | [Input english value     ]
```

- Siempre mostrar ambos idiomas lado a lado
- Label indica el idioma: "Titulo (ES)" / "Title (EN)"
- Campos `_es` y `_en` en la BD

## Tabla de permisos (patron especial)

```
| Modulo              | View | Create | Edit | Delete |
|---------------------|------|--------|------|--------|
| 📦 Categoria         |      |        |      |        |
|   Sub-modulo 1      | ☑    | ☐      | ☑    | ☑      |
|   Sub-modulo 2      | ☑    | ☐      | ☑    | ☐      |

Reglas:
- Categorias en bold con emoji/icono y color Primary/6
- Sub-modulos indentados 12px
- Checkboxes: Ant Design Checkbox (no texto ☑/☐)
- Rows alternadas: bg white / bg #FAFAFA
- Header sticky
```

## Espaciado estandar

| Contexto | Valor |
|---|---|
| Padding content area | 24px |
| Gap entre form fields (vertical) | 16px |
| Gap entre form fields (horizontal) | 24px |
| Gap entre seccion titulo y tabla | 16px |
| Gap entre table y pagination | 16px |
| Card padding interno | 16px |
| Modal padding | 24px |
| Sidebar item height | 40px |
| Table row height | 48px |

## Iconografia

Usar Ant Design Icons:
- Edit: `EditOutlined`
- Delete: `DeleteOutlined`
- Add: `PlusOutlined`
- Search: `SearchOutlined`
- Upload: `UploadOutlined`
- Settings: `SettingOutlined`
- User: `UserOutlined`
- Home: `HomeOutlined`
