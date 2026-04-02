---
name: figma-create-new-file
description: "Crea un nuevo archivo Figma (Design o FigJam) en los drafts del usuario. Usa cuando el usuario necesita un archivo nuevo para empezar un proyecto, prototipar, o crear un design system desde cero."
triggers:
  - "crea un archivo figma"
  - "nuevo archivo figma"
  - "create figma file"
  - "new figma file"
  - "archivo figma nuevo"
tools:
  - whoami
  - create_new_file
---

# Figma Create New File

Crea un nuevo archivo Figma vacio en los drafts del usuario.

## Proceso

### Paso 1: Resolver planKey

```
whoami()
```

El resultado incluye los planes del usuario. Cada plan tiene un campo `key`.
- Si el usuario tiene UN solo plan → usar ese `key` directamente
- Si tiene MULTIPLES planes → preguntar al usuario cual equipo/organizacion usar

### Paso 2: Crear el archivo

```
create_new_file({
  planKey: "{planKey}",
  fileName: "{nombre del archivo}",
  editorType: "design"  // o "figjam" para FigJam boards
})
```

**Parametros:**
- `planKey` (requerido): Key del plan/equipo obtenido en Paso 1
- `fileName` (requerido): Nombre descriptivo para el archivo
- `editorType` (requerido): `"design"` para archivos de diseno, `"figjam"` para FigJam

### Paso 3: Usar el archivo creado

El resultado retorna:
- `file_key`: ID del archivo — usar para operaciones subsiguientes
- `file_url`: URL del archivo en Figma

Pasar el `file_key` a otros skills:
- `/figma-use` para crear contenido
- `/normalization-pipeline` para normalizar
- `/screen-creator` para crear pantallas

## Argumentos del Slash Command

```
/figma-create-new-file [editorType] [fileName]
```

Ejemplos:
- `/figma-create-new-file design "Mi Proyecto v2"`
- `/figma-create-new-file figjam "Brainstorm Sprint 5"`
- `/figma-create-new-file` (preguntara tipo y nombre)
