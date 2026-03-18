# Plan 03: Drift Detection Agent

## Objetivo

Detectar automaticamente las diferencias entre lo que esta disenado en Figma y lo que esta
implementado en produccion/staging, generando un reporte priorizado por impacto.

## Problema que resuelve

- "El diseno dice azul pero en prod es verde" — nadie lo noto
- "Ese componente se actualizo hace 2 meses pero Figma sigue con la version vieja"
- "El spacing es diferente en mobile pero solo se ve en ciertos breakpoints"
- "No sabemos cuantos frames de Figma se implementaron realmente"

## Prerequisitos

- Figma Remote MCP configurado
- GitNexus indexado con el proyecto
- Acceso a produccion o staging (URL)
- Servidor local funcional (localhost)

## Tipos de Drift

### 1. Drift Visual
**Que es:** La UI renderizada se ve diferente al frame de Figma.
**Causa comun:** Ajustes en CSS, cambios de contenido, responsive no testeado.
**Deteccion:** Comparacion de screenshots (Figma vs produccion).

### 2. Drift Estructural
**Que es:** El DOM tiene componentes que Figma no muestra, o viceversa.
**Causa comun:** Features agregadas en codigo sin actualizar diseno.
**Deteccion:** Comparar metadata de Figma vs DOM tree.

### 3. Drift de Tokens
**Que es:** Los colores/fonts/spacing en codigo no coinciden con las variables de Figma.
**Causa comun:** Alguien cambio tailwind.config sin actualizar Figma.
**Deteccion:** Comparar get_variable_defs vs tailwind.config.ts.

### 4. Drift de Cobertura
**Que es:** Frames en Figma que nunca se implementaron, o paginas en codigo sin diseno.
**Causa comun:** Backlog priorizado, MVPs, features descartadas.
**Deteccion:** Cruzar lista de frames con rutas del proyecto.

## Flujo de Deteccion

### Fase 1: Inventario

```
PASO 1: INVENTARIO DE FIGMA
  Tool: get_metadata(pageId: "0:1", fileKey)
  Para cada page del archivo:
  - Listar todos los frames de nivel superior
  - Registrar: nombre, dimensiones, ultima modificacion

PASO 2: INVENTARIO DE CODIGO
  Tool: gitnexus_query("pages routes")
  Listar:
  - Todas las rutas del proyecto (src/app/[locale]/(website)/)
  - Componentes principales por ruta
  - Fecha de ultima modificacion (git log)

PASO 3: CRUCE DE INVENTARIOS
  Crear tabla:
  | Frame Figma | Ruta Codigo | Status |
  |---|---|---|
  | HotelDetail | /hotels/[slug] | Ambos existen |
  | NewPromo | - | Solo en Figma |
  | - | /contact | Solo en codigo |
```

### Fase 2: Comparacion Visual

```
PASO 4: CAPTURA DE FIGMA
  Para cada frame con equivalente en codigo:
  Tool: get_screenshot(nodeId, fileKey)
  Guardar como referencia

PASO 5: CAPTURA DE PRODUCCION
  Opcion A (con generate_figma_design):
  - Capturar UI y enviar a Figma como nueva pagina "[Prod Capture]"
  - Comparar frames lado a lado en Figma

  Opcion B (con preview_screenshot):
  - Levantar localhost
  - Navegar a la ruta
  - Capturar screenshot con preview_screenshot

  Opcion C (con URL de staging):
  - Usar get_screenshot o WebFetch del staging

PASO 6: COMPARACION
  Claude analiza ambas imagenes y detecta:
  - Diferencias de layout (posicion, tamano)
  - Diferencias de color
  - Diferencias de tipografia
  - Elementos faltantes o sobrantes
  - Diferencias de spacing
```

### Fase 3: Comparacion de Tokens

```
PASO 7: TOKENS DE FIGMA
  Tool: get_variable_defs(nodeId, fileKey)
  Extraer:
  - Color palette completa
  - Spacing scale
  - Typography ramp
  - Border radius values
  - Shadow values

PASO 8: TOKENS DE CODIGO
  Leer tailwind.config.ts (o equivalente)
  Extraer mismas categorias

PASO 9: DIFF DE TOKENS
  | Token | Figma | Codigo | Match |
  |---|---|---|---|
  | primary | #1E40AF | blue-700 (#1D4ED8) | DIFERENTE |
  | spacing-sm | 8px | 0.5rem (8px) | OK |
  | font-heading | Inter | Inter | OK |
  | border-radius | 8px | rounded-lg (8px) | OK |
```

### Fase 4: Analisis de Cambios Recientes

```
PASO 10: CAMBIOS EN CODIGO
  Tool: gitnexus_detect_changes(scope: "compare", base_ref: "main~30")
  → Que archivos cambiaron en los ultimos 30 commits
  → Que componentes se modificaron
  → Que flujos se afectaron

PASO 11: CORRELACION
  Para cada componente modificado en codigo:
  - Verificar si el frame correspondiente en Figma tambien cambio
  - Si codigo cambio pero Figma no → DRIFT confirmado
```

## Formato del Reporte

```markdown
# Drift Detection Report
**Proyecto:** [nombre]
**Fecha:** YYYY-MM-DD
**Figma:** [URL del archivo]
**Produccion:** [URL]

## Score de Sincronizacion: XX%

## Drift Critico (requiere accion inmediata)

### 1. Hotel Detail — Hero Section
- **Frame Figma:** HotelDetail/Hero (node: 1635:27981)
- **Ruta codigo:** /hotels/[slug] → HeroBanner component
- **Tipo:** Visual + Estructural
- **Descripcion:** El hero en produccion tiene un badge "Nuevo" que
  no existe en Figma. El color del CTA cambio de azul a verde.
- **Screenshot Figma:** [imagen]
- **Screenshot Prod:** [imagen]
- **Impacto:** Alto (pagina con mas trafico)
- **Accion:** Actualizar frame en Figma o revertir cambio en codigo

### 2. Tokens — Color Primary
- **Tipo:** Token drift
- **Figma:** #1E40AF
- **Codigo:** #1D4ED8 (blue-700)
- **Delta:** Visible (azul ligeramente diferente)
- **Accion:** Alinear en Figma o ajustar tailwind.config

## Drift Moderado (planificar correccion)

### 3. Contact Page
- **Tipo:** Cobertura — existe en codigo, sin frame en Figma
- **Accion:** Capturar con generate_figma_design

## Sin Drift (sincronizados)
- Home page ✅
- Footer ✅
- Navigation ✅

## Resumen
| Metrica | Valor |
|---|---|
| Total frames auditados | 24 |
| Sincronizados | 18 (75%) |
| Drift visual | 3 |
| Drift de tokens | 2 |
| Solo en Figma | 1 |
| Solo en codigo | 2 |
```

## Priorizacion de Issues

| Nivel | Criterio | Accion |
|---|---|---|
| CRITICAL | Pagina de alto trafico + diferencia visible | Corregir esta semana |
| HIGH | Componente compartido (usado en 5+ paginas) | Corregir en el sprint |
| MEDIUM | Pagina individual + diferencia menor | Backlog |
| LOW | Token drift < 5% delta | Nice to have |

La priorizacion usa `gitnexus_impact` para determinar cuantos flujos afecta cada componente.

## Automatizacion (Scheduled Task)

Se puede configurar como tarea recurrente:

```
Frecuencia: Semanal (lunes 9am)
Scope: Top 10 paginas por trafico
Output: Reporte en Slack/email + issue si hay drift critico
```

Implementacion via `mcp__scheduled-tasks__create_scheduled_task`:
```json
{
  "taskId": "drift-detection-weekly",
  "cronExpression": "0 9 * * 1",
  "prompt": "Run drift detection for Oasis Hoteles. Compare top 10 pages...",
  "description": "Weekly drift detection between Figma and production"
}
```

## Limitaciones

1. La comparacion visual depende de la capacidad multimodal de Claude — no es pixel-perfect
2. Contenido dinamico (datos de API) puede causar falsos positivos
3. Responsive drift requiere capturar multiples breakpoints (mas tiempo)
4. Animaciones y estados interactivos no se comparan automaticamente
5. Dark mode necesita captura separada
6. Performance: archivos Figma grandes (100+ frames) necesitan sampling
