# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Que es esto

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills, runbooks y prompts que Claude Code interpreta para operar sobre Figma.
Funciona con CUALQUIER proyecto, framework o libreria UI.

## Stack MCP (Dos Canales)

| MCP | Canal | Funcion |
|-----|-------|---------|
| **figma-console-mcp** | WebSocket (Plugin API) | ESCRITURA PRIMARIA: crear, mover, eliminar, renombrar, redimensionar nodes |
| **Figma Remote** | HTTP REST (PAT token) | LECTURA: metadata, screenshots, design context, Code Connect |
| **Figma Remote (use_figma)** | HTTP REST (Plugin API via MCP) | ESCRITURA ALTERNATIVA: JS Plugin API sin Desktop Bridge. Beta, sera de pago |
| **GitNexus** | Local (opcional) | Analisis de impacto en codigo, descubrimiento de componentes |

**Arquitectura de conexion:**
```
Figma Desktop <--WebSocket:9223--> figma-console-mcp <--> Claude Code  (ESCRITURA PRIMARIA)
Figma Cloud  <--HTTP REST--------> use_figma         <--> Claude Code  (ESCRITURA ALTERNATIVA)
PAT Token    --> REST API --------> Figma Cloud       <--> Claude Code  (LECTURA)
```

## Reglas Criticas

- **figma-console-mcp** requiere Figma Desktop (NO web app) con el plugin Desktop Bridge corriendo
- Antes de CUALQUIER operacion de escritura, verificar conexion con `figma_get_status`
- Las operaciones de escritura van por Plugin API (WebSocket), NO por REST API
- `figma_execute` ejecuta JS arbitrario en contexto del plugin — herramienta mas poderosa, usada para operaciones en lote, crear paginas, mover nodes entre paginas
- Solo 2 operaciones requieren intervencion manual: copiar entre archivos Figma e importar librerias externas
- Solo UN archivo Figma activo por conexion WebSocket (cambiar con `figma_navigate`)
- **Antes de CUALQUIER `use_figma` o `figma_execute`, cargar `/figma-use`** — contiene 17 reglas pre-flight que previenen errores del Plugin API
- **Antes de crear componentes, buscar con `search_design_system`** — si existe en libreria publicada, importar en vez de recrear

## Seleccion de Canal de Escritura

Antes de cualquier operacion de escritura, detectar canal disponible:

```
1. figma_get_status → OK?
   SI → usar figma-console-mcp (PRIMARIO: 15+ tools dedicados, lint, screenshots real-time)
   NO → use_figma disponible?
        SI → usar use_figma (FALLBACK: 1 tool generico con JS Plugin API, sin Desktop Bridge)
        NO → modo READ-ONLY (informar al usuario como configurar)
```

**figma-console-mcp** es preferido porque ofrece herramientas dedicadas (figma_setup_design_tokens, figma_lint_design, figma_capture_screenshot) que `use_figma` no tiene. Ver `docs/decisions/05-official-mcp-write-channel.md` para detalles.

## Parseo de URLs de Figma

```
Formato URL: https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
URL de branch: https://figma.com/design/{fileKey}/branch/{branchKey}/{fileName}
  → Usar branchKey como fileKey

Conversion de Node ID: la URL usa "-", los tools usan ":"
  1635-27981 (URL) → 1635:27981 (parametro)
```

## Skills (15, todos project-agnostic)

### Prerequisitos
| Skill | Cuando usar |
|-------|-------------|
| `/figma-use` | **OBLIGATORIO** antes de cualquier `use_figma` o `figma_execute`. Reglas pre-flight, gotchas, patrones del Plugin API |

### Normalizacion
| Skill | Cuando usar |
|-------|-------------|
| `/normalization-pipeline` | **Pipeline completo** para normalizar un archivo Figma desordenado (6 fases en orden) |
| `/design-normalizer` | Auditar salud del archivo Figma (score 0-100, naming, tokens, Auto Layout) |

### Creacion
| Skill | Cuando usar |
|-------|-------------|
| `/screen-creator` | Crear pantallas nuevas (siempre clona una hermana existente, nunca desde cero) |
| `/component-library-sync` | Registrar componentes nuevos en la pagina Design System |
| `/variant-generator` | Generar variantes desde props/enums del codigo |
| `/figma-create-new-file` | Crear un nuevo archivo Figma (Design o FigJam) en drafts |

### Sincronizacion
| Skill | Cuando usar |
|-------|-------------|
| `/figma-sync` | Orquestador — rutea al sub-skill correcto segun el intent |
| `/token-sync` | Sincronizar design tokens (Figma ↔ codigo, o design-only) |
| `/code-connect-bridge` | Mapear componentes de Figma a componentes de codigo |
| `/design-system-rules-generator` | Generar reglas de design system para CLAUDE.md/AGENTS.md/.cursor/rules |

### Calidad
| Skill | Cuando usar |
|-------|-------------|
| `/drift-detection` | Comparar Figma vs produccion via diff visual + estructural |
| `/figma-quality-gate` | Checklist de validacion post-creacion |
| `/design-system-health` | Dashboard de salud: auditoria + Library Analytics + Code Connect coverage |
| `/ui-framework-patterns` | Patrones de pantallas CRUD por framework UI |

## Pipeline de Normalizacion (orden estricto)

Para normalizar un archivo Figma desordenado, ejecutar EN ESTE ORDEN:

```
1. /design-normalizer       → Auditoria (score inicial, inventario de colores)
2. Limpieza estructural     → Renombrar layers, aplanar nesting, organizar paginas
3. /token-sync              → Extraer colores REALES del diseno, crear y aplicar variables
4. Auto Layout              → Convertir layouts fijos a flexbox (bottom-up)
5. /component-library-sync  → Extraer y organizar componentes
6. /figma-quality-gate      → Validacion final (score objetivo: >80)
```

**REGLA:** Tokens ANTES de componentes. Siempre.
**REGLA:** Fuente de verdad de colores = el diseno, NUNCA el codigo.
**REGLA:** Checkpoint visual despues de cada fase. Si algo se ve mal → undo.
**REGLA:** Aplicar variables por CONTEXTO (nombre/tipo de nodo), NO por hex match.
**REGLA:** Copiar componentes como referencia ANTES de tokenizar.

## Errores Conocidos en Tokenizacion

| Error | Causa | Prevencion |
|-------|-------|------------|
| Colores no coinciden | Se usaron colores del codigo | Escanear hex reales del archivo Figma |
| Nodos se ven negros | Bindings huerfanas de colecciones borradas | NUNCA borrar colecciones. Usar undo |
| Mismo color donde no debe | Batch-apply por hex no distingue contexto | Aplicar por CONTEXTO primero, hex match solo como fallback |
| Cuadros negros en placeholders | Fills IMAGE ignorados | Escanear ALL fill types (SOLID + IMAGE) |
| Texto invisible en botones | Texto y fondo del mismo color | Verificar contraste en variantes hover/active |
| Colores intencionales cambiados | Se "arreglaron" colores que eran correctos | Comparar con referencia antes de cambiar |

## Arquitectura: Como Interactuan los Skills

```
Prompt del usuario → figma-sync (orquestador)
                       ├── "implementa este frame" → flujo Figma→Code
                       ├── "actualiza figma"        → flujo Code→Figma
                       ├── "normaliza"              → normalization-pipeline
                       ├── "audita"                 → design-normalizer
                       ├── "que cambio"             → drift-detection
                       ├── "mapea componentes"      → code-connect-bridge
                       ├── "temas multi-brand"      → token-sync (Extended Collections)
                       └── "salud design system"    → design-system-health
```

Todos los skills se adaptan al proyecto destino leyendo:
1. El archivo Figma activo — estructura, componentes, tokens existentes
2. El CLAUDE.md del proyecto destino — convenciones, stack, reglas
3. El codigo del proyecto — componentes, props, estilos

## Referencia de Herramientas Figma Console

**Operaciones sobre nodes:** `figma_create_child`, `figma_delete_node`, `figma_rename_node`, `figma_move_node`, `figma_resize_node`, `figma_clone_node`, `figma_set_text`, `figma_set_fills`, `figma_set_strokes`

**Componentes:** `figma_instantiate_component`, `figma_search_components`, `figma_get_component_details`, `figma_set_instance_properties`

**Variables/tokens:** `figma_setup_design_tokens` (crear coleccion + modes + variables en UNA llamada), `figma_batch_create_variables` (hasta 100), `figma_batch_update_variables`

**Lectura:** `figma_get_status`, `figma_get_selection`, `figma_get_file_data`, `figma_lint_design`, `figma_capture_screenshot`

**Busqueda en librerias:** `search_design_system` (buscar componentes, variables, estilos en TODAS las librerias publicadas conectadas al archivo)

## Referencia de Herramientas Figma Remote (use_figma)

**Escritura alternativa (sin Desktop Bridge):**
- `use_figma(fileKey, code, description)` — ejecuta JS Plugin API via HTTP. Equivale a `figma_execute` pero no requiere Desktop Bridge.
- Permite: crear frames, componentes, variables, auto layout, aplicar fills/strokes, instanciar componentes
- NO permite: lint (`figma_lint_design`), screenshots real-time (`figma_capture_screenshot`)
- Usar solo cuando figma-console-mcp no esta disponible

## Capacidades Nuevas de Figma (2025-2026)

### Extended Variable Collections (Theming) — Solo Enterprise
Las colecciones se pueden "extender" para crear temas multi-brand. La coleccion hija hereda modes y variables del padre, con overrides por tema.
- Plugin API: `figma.variables.extendLibraryCollectionByKeyAsync(collectionKey, name)`
- Lectura por tema: `variable.valuesByModeForCollectionAsync(collection)`
- **Requisito:** Plan Enterprise. Base debe ser Library publicada.
- **Fallback sin Enterprise:** Usar modes dentro de una coleccion (max 4 en Professional)

### Code Connect UI Nativa — Organization/Enterprise
Code Connect ahora tiene UI nativa en Figma con conexion directa a GitHub.
- AI sugiere que archivo de codigo mapear a cada componente
- Genera snippets automaticamente
- Nuevo campo: **MCP usage instructions** — texto que dice a LLMs como usar el componente
- Cuando `get_design_context` retorna MCP usage instructions, RESPETARLAS al generar codigo
- Nuestro `/code-connect-bridge` complementa la UI nativa para automatizacion y bulk

### Library Analytics API — Solo Enterprise
API REST para datos de uso del design system.
- Scope requerido: `library_analytics:read`
- 6 endpoints: components/styles/variables x actions/usages
- Datos: instancias por componente, detachments, inserciones, archivos de uso
- Datos recalculados diariamente a 00:00 UTC, paginados (max 1000 rows)
- Usado por `/drift-detection` y `/design-system-health`

### Check Designs Linter
Linter nativo de Figma que detecta valores raw que deberian ser variables.
- Modelo custom sugiere la variable correcta por contexto
- Se activa via quick action o al marcar "ready for dev"
- Complementa `figma_lint_design` (que corre via API)
- Usado como referencia en `/figma-quality-gate` y `/design-normalizer`

## Troubleshooting

**"No conecta a Figma Desktop"**: Verificar que el plugin Desktop Bridge esta corriendo (punto verde). Buscar procesos zombi: `lsof -i :9223`. Matar y reiniciar si es necesario.

**"Las escrituras fallan pero las lecturas funcionan"**: Las escrituras necesitan el plugin Desktop Bridge (WebSocket). Las lecturas usan REST API (token). Verificar que el plugin este corriendo en Figma Desktop.

**"Conflicto de puerto"**: `kill $(lsof -t -i :9223)` y reiniciar Claude Code.

**"use_figma no disponible"**: Verificar que Figma Remote MCP esta configurado (`claude mcp add --transport http figma-remote https://mcp.figma.com/mcp`). El tool `use_figma` requiere que el MCP server de Figma este en la sesion. Verificar con `whoami`.

**"Extended Collections falla / no aparece"**: Extended Variable Collections requiere plan Enterprise. En planes Professional, usar modes dentro de una coleccion (max 4 modes). `extendLibraryCollectionByKeyAsync` lanza error si no es Enterprise.

## Adopcion en Proyectos Nuevos

Ver `docs/how-to-adopt.md` para la guia completa. Quick start:
1. Copiar `.claude/skills/` a tu proyecto
2. Configurar `figma-console-mcp` con tu Figma PAT
3. Abrir el plugin Desktop Bridge en tu archivo de Figma (o usar `use_figma` como alternativa sin Desktop)
4. Ejecutar `/design-normalizer` para auditar el estado actual
