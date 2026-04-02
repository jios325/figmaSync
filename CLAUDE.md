# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Que es esto

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills, runbooks y prompts que Claude Code interpreta para operar sobre Figma.
Funciona con CUALQUIER proyecto, framework o libreria UI.

## Stack MCP (Dos Canales)

| MCP | Canal | Funcion |
|-----|-------|---------|
| **figma-console-mcp** | WebSocket (Plugin API) | ESCRITURA: crear, mover, eliminar, renombrar, redimensionar nodes |
| **Figma Remote** | HTTP REST (PAT token) | LECTURA: metadata, screenshots, design context, Code Connect |
| **GitNexus** | Local (opcional) | Analisis de impacto en codigo, descubrimiento de componentes |

**Arquitectura de conexion:**
```
Figma Desktop <--WebSocket:9223--> figma-console-mcp <--> Claude Code  (ESCRITURA)
PAT Token --> REST API --> Figma Cloud                                  (LECTURA)
```

## Reglas Criticas

- **Canal primario de escritura: `use_figma`** (Figma Remote MCP via HTTP). No requiere Desktop Bridge ni Figma Desktop
- **NUNCA bloquear pidiendo Desktop Bridge.** Si `figma-console-mcp` no esta disponible, continuar con `use_figma`
- **figma-console-mcp es OPCIONAL** — solo necesario para `figma_lint_design` y `figma_capture_screenshot` (real-time). Si no esta configurado, ignorar
- Antes de CUALQUIER `use_figma`, cargar `/figma-use` con las 17 reglas pre-flight del Plugin API
- Antes de crear componentes, buscar con `search_design_system` en librerias publicadas
- Solo 2 operaciones requieren intervencion manual: copiar entre archivos Figma e importar librerias externas

## Parseo de URLs de Figma

```
Formato URL: https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
URL de branch: https://figma.com/design/{fileKey}/branch/{branchKey}/{fileName}
  → Usar branchKey como fileKey

Conversion de Node ID: la URL usa "-", los tools usan ":"
  1635-27981 (URL) → 1635:27981 (parametro)
```

## Skills (11, todos project-agnostic)

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

### Sincronizacion
| Skill | Cuando usar |
|-------|-------------|
| `/figma-sync` | Orquestador — rutea al sub-skill correcto segun el intent |
| `/token-sync` | Sincronizar design tokens (Figma ↔ codigo, o design-only) |
| `/code-connect-bridge` | Mapear componentes de Figma a componentes de codigo |

### Calidad
| Skill | Cuando usar |
|-------|-------------|
| `/drift-detection` | Comparar Figma vs produccion via diff visual + estructural |
| `/figma-quality-gate` | Checklist de validacion post-creacion |
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
                       └── "mapea componentes"      → code-connect-bridge
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

## Troubleshooting

**"No conecta a Figma Desktop"**: Verificar que el plugin Desktop Bridge esta corriendo (punto verde). Buscar procesos zombi: `lsof -i :9223`. Matar y reiniciar si es necesario.

**"Las escrituras fallan pero las lecturas funcionan"**: Las escrituras necesitan el plugin Desktop Bridge (WebSocket). Las lecturas usan REST API (token). Verificar que el plugin este corriendo en Figma Desktop.

**"Conflicto de puerto"**: `kill $(lsof -t -i :9223)` y reiniciar Claude Code.

## Adopcion en Proyectos Nuevos

Ver `docs/how-to-adopt.md` para la guia completa. Quick start:
1. Copiar `.claude/skills/` a tu proyecto
2. Configurar `figma-console-mcp` con tu Figma PAT
3. Abrir el plugin Desktop Bridge en tu archivo de Figma
4. Ejecutar `/design-normalizer` para auditar el estado actual
