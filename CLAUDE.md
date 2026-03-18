# FigmaSync — AI Design Operations Toolkit

## Que es este proyecto

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
Funciona con CUALQUIER proyecto — no esta atado a un framework, libreria UI, o repo especifico.

> No es una app. Son skills, runbooks y prompts que Claude Code interpreta para operar sobre Figma.

## Stack de herramientas MCP

| MCP | Tipo | Funcion |
|-----|------|---------|
| **figma-console-mcp** | Local (WebSocket) | ESCRITURA: crear, mover, eliminar, renombrar nodes en Figma |
| **Figma Remote** | HTTP (Cloud) | LECTURA: metadata, screenshots, design context, Code Connect |
| **GitNexus** | Local (opcional) | Analisis de impacto en codigo |

## Estructura

```
figmaSync/
├── CLAUDE.md                  ← Este archivo (contexto AI)
├── README.md                  ← Documentacion publica
├── docs/
│   ├── architecture.md        ← Arquitectura, flujo de datos, referencia MCP
│   ├── how-to-adopt.md        ← Guia para adoptar en cualquier proyecto
│   ├── decisions/             ← ADRs y decisiones de diseno
│   └── runbooks/              ← Workflows paso a paso
├── .claude/
│   ├── settings.json
│   ├── hooks/
│   └── skills/                ← 10 skills (todos project-agnostic)
│       ├── figma-sync/        ← Orquestador principal
│       ├── screen-creator/    ← Crear pantallas nuevas
│       ├── component-library-sync/ ← Gestionar libreria de componentes
│       ├── token-sync/        ← Sincronizar design tokens
│       ├── ui-framework-patterns/  ← Patrones por framework UI
│       ├── variant-generator/ ← Generar variantes desde codigo
│       ├── figma-quality-gate/ ← Validacion post-creacion
│       ├── design-normalizer/ ← Auditar archivos Figma
│       ├── drift-detection/   ← Detectar diferencias Figma vs prod
│       └── code-connect-bridge/ ← Mapear componentes Figma a codigo
└── tools/
    ├── scripts/
    └── prompts/               ← Templates de reportes
```

## Reglas criticas

- **figma-console-mcp** requiere Figma Desktop con el plugin Desktop Bridge corriendo
- Antes de escribir en Figma, SIEMPRE verificar conexion con `figma_get_status`
- Las operaciones de escritura van por Plugin API (WebSocket), no por REST API
- `figma_execute` ejecuta JS arbitrario en contexto del plugin — es la herramienta mas poderosa
- Solo 2 operaciones requieren intervencion manual: copiar entre archivos Figma e importar librerias externas

## Filosofia: Project-Agnostic

Este toolkit NO asume:
- Que framework UI usas (Ant Design, Material UI, Chakra, Tailwind, etc.)
- Que framework de codigo usas (React, Vue, Svelte, etc.)
- Que estructura tiene tu proyecto
- Que naming convention usas

Cada skill se adapta al proyecto donde se ejecuta leyendo:
1. **El archivo Figma activo** — estructura, componentes, tokens existentes
2. **El CLAUDE.md del proyecto destino** — convenciones, stack, reglas
3. **El codigo del proyecto** — componentes, props, estilos

## Skills disponibles

### Creacion
| Skill | Cuando usar |
|-------|-------------|
| `screen-creator` | Crear pantallas nuevas siguiendo patrones existentes |
| `component-library-sync` | Registrar componentes nuevos en Design System |
| `variant-generator` | Crear variantes desde props/enums del codigo |

### Sincronizacion
| Skill | Cuando usar |
|-------|-------------|
| `figma-sync` | Orquestar cualquier operacion Figma <-> Codigo |
| `token-sync` | Sincronizar design tokens (colores, spacing, tipografia) |
| `code-connect-bridge` | Mapear componentes Figma a componentes de codigo |

### Calidad
| Skill | Cuando usar |
|-------|-------------|
| `design-normalizer` | Auditar y normalizar archivos de Figma |
| `drift-detection` | Detectar diferencias entre diseno y produccion |
| `figma-quality-gate` | Validar calidad post-creacion |
| `ui-framework-patterns` | Patrones CRUD por framework UI |

## Como adoptar en un proyecto nuevo

1. Copiar `.claude/skills/` a tu proyecto
2. Configurar `figma-console-mcp` con tu Figma Personal Access Token
3. Abrir el plugin Desktop Bridge en tu archivo de Figma
4. (Opcional) Crear `.claude/skills/ui-framework-patterns/SKILL.md` con patrones especificos de tu framework UI
5. Ejecutar `/design-normalizer` para auditar el estado actual de tu Figma

Ver `docs/how-to-adopt.md` para la guia completa.
