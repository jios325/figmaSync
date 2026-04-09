# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Que es esto

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills, runbooks y prompts que Claude Code interpreta para operar sobre Figma.
Funciona con CUALQUIER proyecto, framework o libreria UI.

## Stack MCP

| MCP | Canal | Funcion |
|-----|-------|---------|
| **Figma Remote** | HTTP REST | LECTURA + ESCRITURA: `use_figma` (writes), `get_metadata`, `get_screenshot`, `get_design_context`, `search_design_system`, etc. |
| **GitNexus** | Local (opcional) | Analisis de impacto en codigo, descubrimiento de componentes |
| **figma-console-mcp** | WebSocket (opcional, legacy) | Solo para `figma_lint_design` y `figma_capture_screenshot` real-time. Requiere Figma Desktop + Desktop Bridge |

**Arquitectura de conexion:**
```
Figma Cloud <--HTTP REST--> Figma Remote MCP <--> Claude Code  (LECTURA + ESCRITURA)
```

## Reglas Criticas

- **Canal de escritura: `use_figma`** (Figma Remote MCP via HTTP). No requiere Desktop Bridge ni Figma Desktop
- Antes de CUALQUIER `use_figma`, cargar `/figma-use` con las 17 reglas pre-flight del Plugin API
- Antes de crear componentes, buscar con `search_design_system` en librerias publicadas
- Solo 2 operaciones requieren intervencion manual: copiar entre archivos Figma e importar librerias externas
- **figma-console-mcp es OPCIONAL** — solo aporta `figma_lint_design` y `figma_capture_screenshot` (real-time). Si no esta configurado, ignorar

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
1b. Detectar librerias       → Escanear instancias con `remote: true` (Ant Design, Material, etc.)
                               Estas se RESPETAN, no se duplican ni se mueven.
2. Limpieza estructural     → Renombrar layers, aplanar nesting, organizar paginas
3. Consolidar duplicados    → ANTES de tokenizar. Merge variantes tema/estado en 1 component set.
4. /token-sync              → Extraer colores REALES del diseno, crear y aplicar variables
5. Auto Layout (SELECTIVO)  → SOLO en componentes simples (atoms). NO aplicar ciegamente a
                               componentes con posicionamiento absoluto complejo (cards, tables, bars).
                               Guardar child positions ANTES de aplicar. Validar visualmente DESPUES.
6. /component-library-sync  → Extraer y organizar componentes por Atomic Design
7. Validacion pantallas     → Comparar CADA pantalla vs archivo original (screenshot diff)
8. /figma-quality-gate      → Validacion final (score objetivo: >80)
```

**REGLA:** Tokens ANTES de componentes. Siempre.
**REGLA:** Fuente de verdad de colores = el diseno, NUNCA el codigo.
**REGLA:** Checkpoint visual despues de cada fase. Si algo se ve mal → undo.
**REGLA:** Aplicar variables por CONTEXTO (nombre/tipo de nodo), NO por hex match.
**REGLA:** Copiar componentes como referencia ANTES de tokenizar.
**REGLA:** Componentes de librerias externas (`remote: true`) se RESPETAN. No mover, no duplicar, no recrear.
**REGLA:** Auto Layout es DESTRUCTIVO — revertir `layoutMode=NONE` NO restaura posiciones originales. Guardar positions antes.

## Errores Conocidos

### Tokenizacion
| Error | Causa | Prevencion |
|-------|-------|------------|
| Colores no coinciden | Se usaron colores del codigo | Escanear hex reales del archivo Figma |
| Nodos se ven negros | Bindings huerfanas de colecciones borradas | NUNCA borrar colecciones. Usar undo |
| Mismo color donde no debe | Batch-apply por hex no distingue contexto | Aplicar por CONTEXTO primero, hex match solo como fallback |
| Cuadros negros en placeholders | Fills IMAGE ignorados | Escanear ALL fill types (SOLID + IMAGE) |
| Texto invisible en botones | Texto y fondo del mismo color | Verificar contraste en variantes hover/active |
| Colores intencionales cambiados | Se "arreglaron" colores que eran correctos | Comparar con referencia antes de cambiar |

### Auto Layout
| Error | Causa | Prevencion |
|-------|-------|------------|
| Instancias en pantallas rotas | Auto Layout en componente re-posiciono hijos | Guardar child positions ANTES. Validar screenshots DESPUES |
| Revertir AL no restaura layout | `layoutMode=NONE` mantiene posiciones de AL | Leer posiciones del archivo original y restaurar manualmente |
| Texto invisible en filas | Hijos desplazados fuera del viewport del componente | Verificar que x/y de text nodes estan dentro de width/height |
| Cards/tables colapsadas | Componentes con layout absoluto no toleran AL | No aplicar AL a componentes con children superpuestos o positioned |
| Texto wrapping en instancias | `textAutoResize` cambio de WIDTH_AND_HEIGHT a NONE | Preservar `textAutoResize` original. Verificar en componente Y en instancias |
| Componente resize rompe instancias | El resize del componente propaga pero instancias tienen overrides | Verificar dimensiones de instancias vs original despues de cambios al componente |
| Hijos internos (grandchildren) desfasados | Solo se restauraron children directos, no los nietos (Group>Text) | Restaurar posiciones en TODOS los niveles de profundidad, no solo nivel 1 |

### Librerias Externas
| Error | Causa | Prevencion |
|-------|-------|------------|
| 40%+ instancias "no conectadas" | Son de libreria externa (remote:true), no local | Detectar `node.mainComponent.remote` ANTES de reportar como problema |
| Componentes duplicados innecesarios | Se recreo localmente un componente de Ant Design | Verificar `search_design_system` y `remote` flag antes de crear |

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

## Referencia de Herramientas

### Figma Remote MCP (canal principal)

**Escritura:** `use_figma(fileKey, code, description)` — ejecuta JS Plugin API via HTTP. Permite crear frames, componentes, variables, auto layout, aplicar fills/strokes, instanciar componentes, renombrar, mover, eliminar nodes, etc.

**Lectura:** `get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs`, `search_design_system`, `get_code_connect_map`, `get_code_connect_suggestions`, `get_context_for_code_connect`, `whoami`

**Code Connect:** `send_code_connect_mappings`, `add_code_connect_map`

**Otros:** `create_new_file`, `generate_figma_design`

### figma-console-mcp (opcional, legacy)

**Solo disponible con Desktop Bridge:** `figma_lint_design` (auditoria WCAG + calidad), `figma_capture_screenshot` (screenshot real-time via plugin)

## Troubleshooting

**`use_figma` no disponible**: Verificar que Figma Remote MCP esta configurado: `claude mcp add --transport http figma-remote https://mcp.figma.com/mcp`. Verificar autenticacion con `whoami()`.

**Escrituras fallan**: Verificar que `use_figma` tiene acceso al archivo. Asegurarse de cargar `/figma-use` antes de ejecutar scripts complejos.

**Extended Collections falla**: Requiere plan Enterprise. Fallback: usar modes dentro de una coleccion (max 4 en Professional).

## Adopcion en Proyectos Nuevos

Ver `docs/how-to-adopt.md` para la guia completa. Quick start:
1. Copiar `.claude/skills/` a tu proyecto
2. Configurar Figma Remote MCP: `claude mcp add --transport http figma-remote https://mcp.figma.com/mcp`
3. Ejecutar `/design-normalizer` para auditar el estado actual
