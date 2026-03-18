---
description: "Detecta diferencias entre disenos en Figma y la UI en produccion/staging. Genera reporte priorizado. Usa cuando el usuario pregunta que cambio, que esta desincronizado, o pide comparar Figma vs produccion."
---

# Drift Detection — Comparacion Figma vs Produccion

## Rol

Detectas diferencias entre lo que esta disenado en Figma y lo que esta implementado
en produccion, staging, o localhost. Generas reportes priorizados por impacto.

## Proceso

### Paso 1: Identificar Scope

Preguntar al usuario o inferir:
- **URL de Figma:** Archivo y page/frame especificos
- **URL de produccion/staging:** O confirmar que usara localhost
- **Scope:** Todo el archivo, una page, o un frame especifico

### Paso 2: Inventario de Figma

```
get_metadata(nodeId: "{pageId}", fileKey: "{fileKey}")
```

Crear lista de frames de primer nivel con sus nodeIds y nombres.

### Paso 3: Inventario de Codigo

Si GitNexus esta disponible:
```
gitnexus_query({query: "pages routes components"})
```

Si no, explorar la estructura de archivos del proyecto:
- Listar rutas en src/app/ o pages/
- Listar componentes principales

### Paso 4: Cruzar Inventarios

Crear tabla de correspondencia:

```
| Frame Figma | nodeId | Ruta Codigo | Status |
|---|---|---|---|
| HotelDetail | 1635:27981 | /hotels/[slug] | Ambos |
| NewPromo | 1636:28000 | - | Solo Figma |
| - | - | /contact | Solo Codigo |
```

### Paso 5: Comparacion Visual (para items con "Ambos")

Para cada par Frame↔Ruta:

**a) Capturar Figma:**
```
get_screenshot(nodeId: "{nodeId}", fileKey: "{fileKey}")
```

**b) Capturar Produccion:**
Opcion 1 — Si hay servidor local + preview tools:
```
preview_screenshot(serverId)
```

Opcion 2 — Con generate_figma_design:
```
generate_figma_design({
  outputMode: "clipboard",  // o newFile para comparar en Figma
})
```

**c) Analizar diferencias:**
Comparar ambas imagenes buscando:
- Diferencias de layout (posicion, tamano, alignment)
- Diferencias de color (fondos, textos, bordes)
- Diferencias de tipografia (font, size, weight)
- Elementos faltantes o sobrantes
- Diferencias de spacing (gaps, padding, margins)
- Diferencias de imagenes o iconos

### Paso 6: Comparacion de Tokens

**a) Tokens de Figma:**
```
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
```

**b) Tokens de Codigo:**
Leer tailwind.config.ts (o archivo de tokens equivalente)

**c) Generar diff:**
```
| Categoria | Token | Figma | Codigo | Delta |
|---|---|---|---|---|
| Color | primary | #1E40AF | #1D4ED8 | DIFERENTE |
| Spacing | sm | 8px | 8px | OK |
| Font | heading | Inter Bold 24px | Inter Bold 24px | OK |
| Radius | card | 12px | 8px | DIFERENTE |
```

### Paso 7: Analisis de Cambios Recientes

Si GitNexus esta disponible:
```
gitnexus_detect_changes({scope: "compare", base_ref: "main~30"})
```

Esto muestra que archivos y componentes cambiaron en los ultimos 30 commits.
Correlacionar con los frames de Figma para identificar drift causado por cambios en codigo.

### Paso 8: Priorizar por Impacto

Para cada drift detectado, evaluar impacto:

```
gitnexus_impact({target: "ComponenteAfectado", direction: "upstream"})
```

Asignar prioridad:
- **CRITICAL:** Pagina de alto trafico + diferencia visible grande
- **HIGH:** Componente compartido (5+ paginas) + diferencia
- **MEDIUM:** Pagina individual + diferencia menor
- **LOW:** Token drift < 5% delta visual

### Paso 9: Generar Reporte

```markdown
# Drift Detection Report
**Proyecto:** {nombre}
**Fecha:** {fecha}
**Score de Sincronizacion:** {XX}%

## Resumen
- Frames auditados: {N}
- Sincronizados: {N} ({X}%)
- Con drift: {N}
- Solo en Figma: {N}
- Solo en codigo: {N}

## Drift Critico
### {Nombre} — {Seccion}
- **Frame Figma:** {nombre} (node: {nodeId})
- **Ruta codigo:** {ruta} → {componente}
- **Tipo:** {Visual|Estructural|Token}
- **Descripcion:** {que cambio y por que es importante}
- **Impacto:** {Alto|Medio|Bajo} — {N paginas afectadas}
- **Accion sugerida:** {actualizar Figma|actualizar codigo|merge}

## Drift Moderado
{...}

## Sin Drift (sincronizados)
{lista de frames OK}

## Tokens Desincronizados
| Token | Figma | Codigo | Accion |
|---|---|---|---|
{tabla}

## Siguientes Pasos
1. {accion prioritaria 1}
2. {accion prioritaria 2}
3. {accion prioritaria 3}
```

## Triggers para Ejecutar

- **Manual:** "Que diferencias hay entre Figma y prod?"
- **Post-deploy:** Despues de cada deploy, comparar automaticamente
- **Semanal:** Scheduled task que corre cada lunes
- **Pre-release:** Antes de un release, verificar que todo esta sincronizado

## Limitaciones

- Comparacion visual no es pixel-perfect (depende de Claude multimodal)
- Contenido dinamico puede causar falsos positivos
- Dark mode requiere captura separada
- Animaciones no se comparan
- Rate limits del MCP server pueden limitar capturas masivas
