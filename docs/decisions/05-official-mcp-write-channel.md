# ADR 05: Canal de Escritura Oficial — use_figma (Dual-Write)

## Estado

ACEPTADO (2026-04-01)

## Contexto

FigmaSync usa dos canales MCP para operar sobre Figma:
- **figma-console-mcp** (WebSocket via Desktop Bridge plugin) para ESCRITURA
- **Figma Remote** (HTTP REST API) para LECTURA

En 2026, Figma abrio el canvas a agentes AI via su MCP Server oficial, agregando el tool `use_figma` que permite ejecutar JavaScript del Plugin API via HTTP — sin requerir Figma Desktop ni el plugin Desktop Bridge.

## Problema que Resuelve

1. **Friccion de onboarding:** figma-console-mcp requiere Figma Desktop + plugin Desktop Bridge corriendo. Muchos equipos usan Figma web.
2. **Mantenimiento:** figma-console-mcp es un paquete de terceros. `use_figma` es mantenido por Figma directamente.
3. **Accesibilidad:** Con `use_figma`, cualquier usuario con un PAT de Figma puede escribir al canvas sin setup adicional.

## Decision

**Arquitectura Dual-Write:** figma-console-mcp como canal primario, `use_figma` como fallback.

### Decision Tree (Seleccion de Canal)

```
1. Ejecutar figma_get_status
   ├── OK → usar figma-console-mcp (PRIMARIO)
   │         Razon: mas herramientas dedicadas, real-time, probado
   │
   └── FALLO → verificar si use_figma esta disponible
               ├── SI → usar use_figma (FALLBACK)
               │         Razon: no requiere Desktop Bridge
               │
               └── NO → modo READ-ONLY
                         Informar al usuario como configurar
```

### Comparacion de Canales

| Dimension | figma-console-mcp | use_figma (oficial) |
|-----------|-------------------|---------------------|
| Protocolo | WebSocket (port 9223) | HTTP REST |
| Requiere Desktop | SI (Figma Desktop + plugin) | NO |
| Herramientas dedicadas | 15+ (figma_create_child, figma_set_fills, etc.) | 1 generica (JS Plugin API) |
| Operaciones batch | Nativas (figma_batch_create_variables) | Via JS manual |
| Screenshots real-time | figma_capture_screenshot (plugin) | get_screenshot (REST, cached) |
| Variables/tokens | figma_setup_design_tokens (una llamada) | figma.variables.* (JS manual) |
| Lint | figma_lint_design | No disponible |
| Costo | Gratis (open source) | Beta gratis, sera de pago (pricing TBD) |
| Mantenido por | Comunidad (npm) | Figma (oficial) |
| Conexion | 1 archivo activo por WebSocket | Cualquier archivo via fileKey |

### Mapeo de Herramientas

| figma-console-mcp | Equivalente use_figma |
|---|---|
| `figma_execute(code)` | `use_figma(fileKey, code)` |
| `figma_create_child(parentId, type)` | `use_figma` con `figma.createFrame()` / `figma.createText()` |
| `figma_set_fills(nodeId, fills)` | `use_figma` con `node.fills = [...]` |
| `figma_rename_node(nodeId, name)` | `use_figma` con `node.name = "..."` |
| `figma_clone_node(nodeId)` | `use_figma` con `node.clone()` |
| `figma_setup_design_tokens(...)` | `use_figma` con `figma.variables.createVariableCollection()` + `figma.variables.createVariable()` |
| `figma_batch_create_variables(...)` | `use_figma` con loop de `figma.variables.createVariable()` |
| `figma_instantiate_component(key)` | `use_figma` con `figma.importComponentByKeyAsync(key)` |
| `figma_lint_design(rules)` | No equivalente directo — usar `figma_lint_design` si disponible |
| `figma_capture_screenshot` | No equivalente — usar `get_screenshot` (REST) |

## Estrategia de Migracion

### Fase 1: Documentar + Awareness (AHORA)
- Documentar dual-write en ADR, CLAUDE.md, y skills
- Agregar deteccion automatica de canal en figma-sync orchestrator
- Todos los skills mencionan use_figma como alternativa

### Fase 2: Adoptar como Fallback (CUANDO use_figma SEA GA)
- Implementar wrappers que traduzcan figma-console-mcp calls a use_figma calls
- Testear paridad funcional en operaciones criticas
- Mantener figma-console-mcp como primario

### Fase 3: Evaluar como Primario (FUTURO, SI PRICING ES ACEPTABLE)
- Comparar costo vs beneficio de eliminar Desktop Bridge dependency
- Si use_figma cubre 90%+ de las operaciones → considerar como primario
- figma-console-mcp como fallback para operaciones que use_figma no soporte (lint, real-time screenshots)

## Consecuencias

**Positivas:**
- Elimina barrera de entrada mas grande (Desktop Bridge setup)
- Soporte oficial de Figma = estabilidad a largo plazo
- Permite operar sobre multiples archivos sin cambiar conexion WebSocket

**Negativas:**
- use_figma es 1 tool generico vs 15+ tools dedicados — mas codigo JS manual
- Beta = posibles breaking changes
- Sera de pago — pricing desconocido
- Sin figma_lint_design ni figma_capture_screenshot via use_figma

**Mitigacion:**
- Dual-write = no dependencia exclusiva de ninguno
- figma-console-mcp sigue disponible como primario para usuarios con Desktop
- Features exclusivas de figma-console-mcp (lint, screenshots) siguen accesibles via ese canal
