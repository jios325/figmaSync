# FigmaSync — Sistema de Agentes para Sincronizacion Bidireccional Figma ↔ Codigo

## Vision

Sistema de agentes AI que mantiene sincronizados los disenos de Figma con el codigo en produccion,
normaliza archivos de diseno, detecta drift visual y establece puentes automaticos entre
componentes de Figma y componentes de codigo.

## Problema que resuelve

```
ANTES (flujo roto):
  Diseno Figma → Codigo → Ajustes en prod → Figma queda desactualizado
                                                    ↑ BRECHA

DESPUES (flujo sincronizado):
  Figma ←──────────→ Codigo ←──────────→ Produccion
       get_design_context    generate_figma_design
       Code Connect          Drift Detection
```

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FIGMA SYNC SYSTEM                                │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   NORMALIZER  │  │  SYNC AGENT  │  │   DRIFT      │                   │
│  │   AGENT       │  │              │  │   DETECTOR   │                   │
│  │              │  │  Figma→Code  │  │              │                   │
│  │  Tokens      │  │  Code→Figma  │  │  Screenshots │                   │
│  │  Artboards   │  │  Bidireccional│  │  Comparacion │                   │
│  │  Components  │  │              │  │  Reportes    │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                  │                            │
│  ┌──────┴─────────────────┴──────────────────┴───────┐                   │
│  │              CODE CONNECT BRIDGE                   │                   │
│  │   Mapeo automatico: Figma Node ↔ React Component  │                   │
│  └───────────────────────┬───────────────────────────┘                   │
│                          │                                                │
│  ┌───────────────────────┴───────────────────────────────────────────┐   │
│  │                    HERRAMIENTAS MCP (3 capas)                      │   │
│  │                                                                    │   │
│  │  Figma Console (ESCRITURA):  Figma Remote (LECTURA):  GitNexus:   │   │
│  │  ├─ figma_execute            ├─ get_design_context    ├─ impact    │   │
│  │  ├─ figma_create_child       ├─ generate_figma_design ├─ context   │   │
│  │  ├─ figma_set_text           ├─ get_metadata          ├─ query     │   │
│  │  ├─ figma_move_node          ├─ get_variable_defs     └─ detect    │   │
│  │  ├─ figma_delete_node        ├─ get_screenshot                    │   │
│  │  ├─ figma_rename_node        ├─ create_design_system_rules        │   │
│  │  ├─ figma_resize_node        ├─ get_code_connect_suggestions      │   │
│  │  ├─ figma_set_fills          └─ send_code_connect_mappings        │   │
│  │  ├─ figma_clone_node                                              │   │
│  │  ├─ figma_instantiate_component                                   │   │
│  │  ├─ figma_setup_design_tokens                                     │   │
│  │  ├─ figma_batch_create_variables                                  │   │
│  │  ├─ figma_lint_design                                             │   │
│  │  └─ figma_get_selection (59+ tools total)                         │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Estructura del Repositorio

```
figmaSync/
├── README.md                          # Este archivo
├── plans/
│   ├── 01-design-normalizer.md        # Plan: Normalizacion de archivos Figma
│   ├── 02-bidirectional-sync.md       # Plan: Sincronizacion bidireccional
│   ├── 03-drift-detection.md          # Plan: Deteccion de diferencias
│   └── 04-code-connect-bridge.md      # Plan: Puente Code Connect
├── skills/
│   ├── figma-sync/
│   │   └── skill.md                   # Skill principal de orquestacion
│   ├── design-normalizer/
│   │   └── skill.md                   # Skill de normalizacion
│   ├── drift-detection/
│   │   └── skill.md                   # Skill de deteccion de drift
│   └── code-connect-bridge/
│       └── skill.md                   # Skill de Code Connect
├── architecture/
│   ├── system-overview.md             # Arquitectura general
│   ├── mcp-tools-reference.md         # Referencia de herramientas MCP
│   └── data-flow.md                   # Flujo de datos entre agentes
├── workflows/
│   ├── new-feature.md                 # Workflow: feature nueva
│   ├── production-hotfix.md           # Workflow: hotfix en prod
│   ├── design-audit.md               # Workflow: auditoria de diseno
│   └── onboarding-project.md         # Workflow: onboarding proyecto nuevo
└── templates/
    ├── design-system-rules.md         # Template para reglas de design system
    ├── drift-report.md                # Template para reportes de drift
    └── figma-file-structure.md        # Template para estructurar archivos Figma
```

## Requisitos

### Herramientas MCP necesarias

| MCP | Tipo | Funcion | Setup |
|-----|------|---------|-------|
| **Figma Console** | Local (WebSocket) | ESCRITURA: crear, mover, eliminar, renombrar nodes | `claude mcp add figma-console -s user -e FIGMA_ACCESS_TOKEN=figd_XXX -e ENABLE_MCP_APPS=true -- npx -y figma-console-mcp@latest` |
| **Figma Remote** | HTTP (Cloud) | LECTURA: metadata, screenshots, design context, Code Connect | `claude mcp add --transport http figma-remote https://mcp.figma.com/mcp` |
| **GitNexus** | Local | Analisis de impacto en codigo | Ya configurado en el proyecto |
| **Claude Preview** | Local | Captura de localhost para Code→Figma | Opcional |

### Setup de Figma Console (Plugin Desktop Bridge)

1. Instalar MCP server: usar comando de la tabla arriba
2. Abrir Figma Desktop (NO la web app)
3. Importar plugin: Plugins > Development > Import plugin from manifest
   - Ruta del manifest: ejecutar `npx figma-console-mcp@latest --print-path`
4. Ejecutar plugin en el archivo Figma que quieras editar
5. Verificar conexion: el plugin muestra "MCP ready" (punto verde)

### Conexion verificada

```
Figma Desktop ←──WebSocket:9223──→ figma-console-mcp ←──→ Claude Code
                 (Plugin Bridge)      (Node.js server)      (MCP client)

Token PAT ──→ REST API ──→ LECTURA (metadata, variables, screenshots)
Plugin    ──→ Plugin API ──→ ESCRITURA (crear, mover, eliminar, renombrar)
```

## Como usar

1. **Copiar skills** al proyecto destino: `cp -r skills/* /tu-proyecto/.claude/skills/`
2. **Adaptar templates** segun tu stack (Next.js, Vue, etc.)
3. **Ejecutar workflows** segun el caso de uso
4. **Verificar** que figma-console-mcp esta conectado antes de operaciones de escritura

## Proyectos compatibles

Disenado para funcionar con cualquier proyecto frontend. Probado inicialmente con:
- **CMS Oasis Hoteles** — Next.js 15, React 19, Ant Design 5 (proyecto activo)
- **Oasis Hoteles** — Next.js 14, React 18, TailwindCSS, next-intl
