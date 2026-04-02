---
name: design-system-health
description: "Dashboard de salud del design system: combina auditoria de archivo, Library Analytics (uso de componentes), y Code Connect coverage. Usa cuando el usuario pregunta por la salud, metricas, adopcion, o estado del design system."
triggers:
  - "salud del design system"
  - "design system health"
  - "metricas de uso"
  - "adoption del design system"
  - "como esta el design system"
  - "dashboard design system"
  - "uso de componentes"
tools:
  - get_metadata
  - get_variable_defs
  - get_code_connect_map
  - figma_execute
  - figma_lint_design
  - use_figma
---

# Design System Health — Dashboard de Salud

## Rol

Generas un dashboard completo de la salud del design system combinando tres dimensiones:
1. **Auditoria estructural** (via design-normalizer) — calidad del archivo Figma
2. **Code Connect coverage** — que tan bien mapeados estan los componentes a codigo
3. **Library Analytics** (Enterprise) o **analisis estatico** (fallback) — datos de uso real

## Proceso

### Paso 1: Auditoria Base

Ejecutar el flujo de `/design-normalizer` para obtener el score 0-100 del archivo:

```
get_metadata(nodeId: "0:1", fileKey: "{fileKey}")
get_variable_defs(nodeId: "0:1", fileKey: "{fileKey}")
```

Registrar:
- Score total (0-100) con desglose por categoria
- Cantidad de colecciones de variables
- Cantidad de componentes locales
- Cantidad de frames/pantallas

### Paso 2: Code Connect Coverage

```
get_code_connect_map(nodeId: "0:1", fileKey: "{fileKey}")
```

Calcular:
- Total componentes en Figma (del Paso 1)
- Componentes con mapeo Code Connect
- Coverage % = mapeados / total
- Componentes sin mapeo que deberian tenerlo (excluir decorativos)

### Paso 3: Datos de Uso

**Si Enterprise (Library Analytics API):**

Consultar los 6 endpoints REST:
- `GET /v1/analytics/libraries/{file_key}/components/actions` — inserciones y detachments
- `GET /v1/analytics/libraries/{file_key}/components/usages` — instancias por componente
- `GET /v1/analytics/libraries/{file_key}/styles/actions` — uso de estilos
- `GET /v1/analytics/libraries/{file_key}/styles/usages` — instancias de estilos
- `GET /v1/analytics/libraries/{file_key}/variables/actions` — uso de variables
- `GET /v1/analytics/libraries/{file_key}/variables/usages` — instancias de variables

Scope requerido: `library_analytics:read`
Datos recalculados diariamente a 00:00 UTC. Paginados (max 1000 rows).

Extraer:
- Top 10 componentes mas usados (por instancias)
- Componentes con alto detachment rate (>20%) — posible signal de problemas
- Componentes con 0 instancias — candidatos a deprecar
- Archivos que mas usan la libreria
- Tendencia de adopcion (comparar con periodos anteriores si disponible)

**Si NO Enterprise (analisis estatico fallback):**

```javascript
// figma_execute o use_figma: contar instancias por componente
const componentUsage = {};
function countInstances(node) {
  if (node.type === 'INSTANCE') {
    const mainId = node.mainComponent?.id || 'unknown';
    const name = node.mainComponent?.name || node.name;
    componentUsage[name] = (componentUsage[name] || 0) + 1;
  }
  if ('children' in node) node.children.forEach(countInstances);
}
figma.root.children.forEach(page => {
  page.children.forEach(countInstances);
});
// Retorna: { componentName: instanceCount }
```

Este metodo solo cuenta instancias dentro del mismo archivo (no cross-file).

### Paso 4: Generar Dashboard

```markdown
# Design System Health Dashboard

**Archivo:** {nombre} ({URL})
**Fecha:** {fecha}

## Resumen Ejecutivo
| Metrica | Valor | Estado |
|---------|-------|--------|
| Health Score | {X}/100 | {emoji} |
| Code Connect Coverage | {X}% | {emoji} |
| Componentes en uso | {N}/{total} | {emoji} |
| Token Coverage | {X}% | {emoji} |

## Health Score (Detalle)
| Categoria | Score | Max |
|-----------|-------|-----|
| Estructura | {X} | 25 |
| Tokens | {X} | 25 |
| Componentes | {X} | 25 |
| Auto Layout | {X} | 25 |

## Code Connect Coverage
| Estado | Count | % |
|--------|-------|---|
| Mapeados | {N} | {X}% |
| Sin mapeo (necesitan) | {N} | {X}% |
| Sin mapeo (decorativos) | {N} | {X}% |
| Mapeos rotos | {N} | {X}% |

## Uso de Componentes (Top 10)
| Componente | Instancias | Detachments | Detach Rate | Estado |
|------------|-----------|-------------|-------------|--------|
| {nombre} | {N} | {N} | {X}% | {saludable/en riesgo/deprecar} |

## Componentes Sin Uso (candidatos a deprecar)
| Componente | Ultima modificacion | Recomendacion |
|------------|-------------------|---------------|
| {nombre} | {fecha} | Deprecar / Verificar / Mantener |

## Variables y Tokens
| Coleccion | Variables | Modo | Bindings aplicados |
|-----------|----------|------|--------------------|
| Primitives | {N} | Default | {X}% |
| Semantic | {N} | Default | {X}% |

## Recomendaciones Priorizadas
1. {accion critica — impacto alto}
2. {accion importante — impacto medio}
3. {mejora — impacto bajo}
```

## Interpretacion de Estados

| Metrica | Saludable | En riesgo | Critico |
|---------|-----------|-----------|---------|
| Health Score | 80-100 | 50-79 | 0-49 |
| Code Connect Coverage | >80% | 50-80% | <50% |
| Token Coverage | >90% | 60-90% | <60% |
| Detachment Rate (por componente) | <5% | 5-20% | >20% |

## Integracion con Otros Skills

| Dato | Fuente |
|------|--------|
| Health Score 0-100 | `/design-normalizer` |
| Token inventario | `/token-sync` |
| Code Connect mappings | `/code-connect-bridge` |
| Drift vs produccion | `/drift-detection` |
| Quality de pantallas individuales | `/figma-quality-gate` |

## Automatizacion

Este dashboard se puede ejecutar periodicamente via scheduled task:
```
mcp__scheduled-tasks__create_scheduled_task({
  taskId: "design-system-health-weekly",
  prompt: "Ejecuta /design-system-health para {fileKey}. Genera reporte y guardalo.",
  cronExpression: "0 9 * * 1",  // Lunes 9am
  description: "Weekly design system health check"
})
```
