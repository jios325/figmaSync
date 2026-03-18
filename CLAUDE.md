# FigmaSync — Instrucciones para Claude

## Que es este proyecto

Sistema de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills, runbooks y prompts que Claude Code interpreta.

## Stack de herramientas MCP

| MCP | Tipo | Funcion |
|-----|------|---------|
| **figma-console-mcp** | Local (WebSocket) | ESCRITURA: crear, mover, eliminar, renombrar nodes en Figma |
| **Figma Remote** | HTTP (Cloud) | LECTURA: metadata, screenshots, design context, Code Connect |
| **GitNexus** | Local | Analisis de impacto en codigo |

## Estructura del proyecto

```
figmaSync/
├── CLAUDE.md              ← Este archivo (contexto AI)
├── README.md              ← Documentacion del proyecto
├── docs/
│   ├── architecture.md    ← Arquitectura, flujo de datos, referencia MCP
│   ├── decisions/         ← Planes y decisiones de diseno
│   └── runbooks/          ← Workflows paso a paso
├── .claude/
│   ├── settings.json      ← Configuracion de Claude Code
│   ├── hooks/             ← Guardrails y automatizacion
│   └── skills/            ← Skills reutilizables
│       ├── figma-sync/    ← Orquestador principal
│       ├── design-normalizer/
│       ├── drift-detection/
│       └── code-connect-bridge/
└── tools/
    ├── scripts/           ← Scripts de automatizacion
    └── prompts/           ← Templates de reportes y reglas
```

## Reglas criticas

- **figma-console-mcp** requiere Figma Desktop con el plugin Desktop Bridge corriendo
- Antes de escribir en Figma, SIEMPRE verificar conexion con `figma_get_status`
- Las operaciones de escritura van por Plugin API (WebSocket), no por REST API
- Solo 2 operaciones requieren intervencion manual: copiar entre archivos y importar librerias
- `figma_execute` es la herramienta mas poderosa — ejecuta JS arbitrario en contexto del plugin

## Skills disponibles

| Skill | Cuando usar |
|-------|-------------|
| `/figma-sync` | Orquestar cualquier operacion Figma <-> Codigo |
| `/design-normalizer` | Auditar y normalizar archivos de Figma |
| `/drift-detection` | Detectar diferencias entre diseno y produccion |
| `/code-connect-bridge` | Mapear componentes Figma a componentes de codigo |

## Proyectos donde se usa

- **CMS Oasis Hoteles** (`cms.oasishoteles.com`) — Figma: `ENjr07ZSZvYoCELJWCHafg`
- **Oasis Hoteles** (`oasishoteles2024`) — Figma: `6fN8UlkT1fyrWh8rgAjBuw`
