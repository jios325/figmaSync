---
description: "Audita archivos de Figma para detectar inconsistencias y generar reporte de normalizacion. Usa cuando el usuario pide auditar, normalizar, revisar, o evaluar la calidad de un archivo de Figma."
---

# Design Normalizer — Auditoria de Archivos Figma

## Rol

Auditas archivos de Figma para evaluar su "AI-readiness" — que tan bien preparados estan
para generar codigo de calidad con herramientas MCP.

## Proceso

### Paso 1: Parsear URL de Figma

Extraer del URL proporcionado:
- `fileKey`: el identificador del archivo
- `nodeId`: el nodo especifico (o "0:1" para todo el archivo)

```
URL: https://figma.com/design/{fileKey}/{fileName}?node-id={int1}-{int2}
fileKey = {fileKey}
nodeId = {int1}:{int2}  (cambiar - por :)
```

### Paso 2: Escanear Estructura

Ejecutar:
```
get_metadata(nodeId: "0:1", fileKey: "{fileKey}")
```

Analizar el XML retornado buscando:
- **Pages:** Cantidad, nombres (no deben ser "Page 1", "Page 2")
- **Frames:** Organizacion, agrupacion, naming
- **Profundidad:** Anidacion excesiva (>6 niveles)
- **Layers genericos:** "Frame 123", "Group 45", "Rectangle 67"

### Paso 2.5: Inventario de Colores, Tipografia y Spacing

Ejecutar via `use_figma` un scan recursivo de todos los nodos:

**Colores:** Extraer todos los hex unicos de fills y strokes con conteo de usos.
```javascript
// Traverse all nodes, build { hex: count } map
// Sort by count descending
// OUTPUT: tabla de "colores candidatos a token"
```

**Tipografia:** Extraer combinaciones unicas de fontFamily + fontSize + fontWeight.
```javascript
// For each TEXT node: record { family, size, weight, lineHeight }
// Deduplicate and count
```

**Spacing:** Extraer valores unicos de padding y gap de frames con Auto Layout.
```javascript
// For each frame with layoutMode: record padding (top/right/bottom/left) and gap
// Deduplicate and count
```

El reporte debe incluir estas tablas ordenadas por frecuencia de uso.

### Paso 3: Auditar Tokens

Ejecutar:
```
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
```

Evaluar:
- **Existen variables?** Si no → Score de tokens = 0
- **Jerarquia:** Primitives → Semantic → Component-level
- **Categorias:** Colores, spacing, typography, border-radius, shadows
- **Hardcoded values:** Buscar hex colors o px values sueltos en el diseno

### Paso 4: Auditar Componentes

Para los componentes principales detectados en metadata:
```
get_design_context(nodeId: "{componentNodeId}", fileKey: "{fileKey}")
```

Evaluar:
- **Reutilizables:** Son componentes (no frames unicos)?
- **Variantes:** Cubren estados (default, hover, disabled, loading)?
- **Responsive:** Tienen variantes desktop/tablet/mobile?
- **Auto Layout:** Usan Auto Layout (mapeable a Flexbox)?
- **Duplicados:** Hay componentes casi-identicos?

### Paso 5: Comparar con Codigo (opcional, si hay proyecto de codigo asociado)

Si el usuario indica un proyecto de codigo, delegar a `/token-sync` para la comparacion.
El design-normalizer se enfoca en la salud del archivo Figma, no en la sincronizacion con codigo.

### Paso 6: Generar Reporte

Formato del reporte:

```markdown
# 📊 Design System Audit Report

**Archivo:** {nombre} ({URL})
**Fecha:** {fecha}
**Score Total:** {XX}/100

## Desglose de Score
| Categoria | Score | Max |
|---|---|---|
| Estructura (naming, pages, organizacion) | {X} | 25 |
| Tokens (variables, jerarquia, cobertura) | {X} | 25 |
| Componentes (reutilizables, variantes) | {X} | 25 |
| Auto Layout (cobertura, correctitud) | {X} | 25 |

## Issues Criticos
{lista de issues que bloquean Code Connect o generan codigo malo}

## Issues Importantes
{lista de issues que degradan la calidad del codigo generado}

## Recomendaciones
{mejoras sugeridas, priorizadas por impacto}

## Mapa de Tokens (si aplica)
| Token Figma | Valor | Tailwind Equiv | Estado |
|---|---|---|---|
{tabla de comparacion}
```

### Paso 7: Generar Reglas (Opcional)

Si el usuario lo pide:
```
create_design_system_rules({
  clientLanguages: "typescript,html,css",
  clientFrameworks: "react,nextjs"
})
```

Guardar el resultado como `design-system-rules.md` en el directorio del proyecto.

## Criterios de Scoring

### Estructura (25 puntos)
- Pages con nombres descriptivos: +5
- Frames organizados por seccion/feature: +5
- Naming consistente (PascalCase o kebab-case): +5
- Sin layers genericos ("Frame 123"): +5
- Profundidad razonable (<=6 niveles): +5

### Tokens (25 puntos)
- Variables definidas: +5
- Jerarquia primitive→semantic→component: +5
- Colores como variables (no hardcoded): +5
- Spacing basado en escala: +5
- Typography con ramp definido: +5

### Componentes (25 puntos)
- Componentes reutilizables: +5
- Variantes de estado (hover, disabled): +5
- Variantes responsive: +5
- Sin duplicados: +5
- Props/slots bien definidos: +5

### Auto Layout (25 puntos)
- Aplicado en componentes: +5
- Direction y alignment correctos: +5
- Gap y padding definidos: +5
- Fill vs Hug correctos: +5
- Constraints para responsive: +5

## Edge Cases

- Archivo vacio o con pocas pages → Reportar como "archivo minimal"
- Archivo sin variables → Score tokens = 0, sugerir crear variables primero
- Archivo muy grande (100+ frames) → Auditar por sampling
- Archivo de landing (no app) → Ajustar criterios de componentes
- Archivo compartido entre proyectos → Evaluar por separado cada proyecto
