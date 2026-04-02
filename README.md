# FigmaSync

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills que Claude Code interpreta para operar sobre Figma.
Funciona con **cualquier** proyecto, framework o libreria UI.

## Prerequisitos

- [Claude Code](https://claude.ai/code) instalado
- Cuenta de Figma (cualquier plan)

## Quick Start

```bash
# 1. Copiar skills a tu proyecto
cp -r .claude/skills/ ~/tu-proyecto/.claude/skills/

# 2. Configurar Figma Remote MCP (lectura + escritura)
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp

# 3. Listo. Auditar el archivo:
/figma-sync audita esta libreria: [URL de Figma]
```

Todas las operaciones usan `use_figma` (Figma Remote MCP via HTTP). No requiere Figma Desktop ni plugins.

## Pipeline de Normalizacion (orden estricto)

Para normalizar un archivo Figma desordenado, ejecutar **en este orden**:

### Paso 1: Auditoria
```
/design-normalizer
```
Escanea el archivo completo. Genera score 0-100 con inventario de colores, tipografia, spacing, layers genericos, y problemas de nesting.

### Paso 2: Limpieza Estructural
```
/normalization-pipeline  (fase 1)
```
Renombra layers genericos ("Frame 123" → nombres semanticos), aplana nesting excesivo, organiza paginas, elimina orphans.

### Paso 3: Tokenizacion
```
/token-sync
```
Extrae los colores **reales del diseno** (no del codigo), crea colecciones Primitives + Semantic, y aplica variables a todos los nodos. La apariencia visual NO cambia. Soporta Extended Variable Collections para theming multi-brand (Enterprise).

### Paso 4: Auto Layout
```
/normalization-pipeline  (fase 3)
```
Convierte layouts de posicion absoluta a Auto Layout (Flexbox). Bottom-up: atomos → contenedores → secciones → paginas.

### Paso 5: Componentizacion
```
/component-library-sync
```
Busca en librerias publicadas con `search_design_system` antes de crear. Identifica patrones repetidos, extrae componentes, crea pagina Design System, reemplaza copias con instancias.

### Paso 6: Validacion
```
/figma-quality-gate
```
Verifica naming, Auto Layout, tokens, consistencia. Integra Check Designs linter nativo. Score objetivo: >80/100.

> **REGLA:** Tokens ANTES de componentes. Siempre.
> **REGLA:** Fuente de verdad de colores = el diseno, NUNCA el codigo.
> **REGLA:** Checkpoint visual despues de cada paso. Si algo se ve mal → Cmd+Z.
> **REGLA:** Mismo hex ≠ mismo significado. Revisar componente por componente despues del batch-apply.
> **REGLA:** NUNCA borrar colecciones sin limpiar bindings primero. Preferir undo.
> **REGLA:** Copiar componentes locales como referencia ANTES de tokenizar para comparar despues.
> **REGLA:** Antes de CUALQUIER `use_figma`, cargar `/figma-use` con las 17 reglas pre-flight.

---

## Casos de Uso (Prompts de Ejemplo)

### Normalizar una libreria con Atomic Design
```
/figma-sync normaliza esta libreria usando Atomic Design:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=212-6455
```

### Normalizar un proyecto con pantallas
```
/figma-sync normaliza este proyecto:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

### Auditar sin modificar (solo reporte)
```
/design-normalizer https://www.figma.com/design/XXXXX/mi-archivo?node-id=0-1
```

### Implementar un diseno de Figma en codigo
```
/figma-sync implementa este frame:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=1635-27981
```

### Crear una pantalla nueva en Figma
```
/screen-creator crea la pantalla de Users en:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

### Sincronizar tokens entre Figma y codigo
```
/token-sync sincroniza los tokens de Figma con el codigo:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

### Detectar drift (Figma vs produccion)
```
/drift-detection compara Figma con produccion:
Figma: https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
Produccion: https://mi-app.com
```

### Mapear componentes (Code Connect)
```
/code-connect-bridge mapea los componentes:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

### Generar guidelines para Figma Make Kit
```
/design-system-rules-generator genera guidelines para Make Kit:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```
Genera la carpeta `guidelines/` con `components/*.md`, `foundations/*.md`, `composition/*.md` — el formato que Figma Make usa para construir prototipos con tu design system real.

### Generar reglas para agentes AI
```
/design-system-rules-generator genera reglas para el proyecto:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```
Genera reglas en CLAUDE.md (Claude Code), AGENTS.md (Codex), o .cursor/rules (Cursor).

### Crear un archivo Figma nuevo
```
/figma-create-new-file design "Mi Proyecto v2"
```

### Ver la salud del design system
```
/design-system-health https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

---

## Errores Comunes en Tokenizacion

| Error | Causa | Prevencion |
|-------|-------|------------|
| Colores no coinciden con el diseno | Se usaron colores del codigo en vez del archivo Figma | SIEMPRE escanear hex reales del archivo |
| Nodos se ven negros/oscuros | Se borraron colecciones y quedaron bindings huerfanas | Hacer undo en vez de borrar+recrear |
| Mismo color aplicado donde no debe | Batch-apply por hex no distingue contexto semantico | Revisar cada componente post-aplicacion |
| Cuadros negros en placeholders | Fills tipo IMAGE no detectados (solo se buscaron SOLID) | Buscar todos los fill types, no solo SOLID |
| Texto invisible en botones hover | Texto y fondo del mismo color | Verificar contraste en variantes hover/active |
| Dark mode innecesario | Se crearon modes Light+Dark sin necesidad | Solo Light mode salvo indicacion explicita |

## Todos los Skills (15)

### Prerequisitos
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/figma-use` | Ref | **OBLIGATORIO** antes de `use_figma`/`figma_execute`. 17 reglas pre-flight, gotchas, patrones, scripts JS helper |

### Normalizacion
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/normalization-pipeline` | Write | Pipeline completo de normalizacion (6 fases) |
| `/design-normalizer` | Read | Auditoria con score 0-100 |

### Creacion
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/screen-creator` | Write | Crear pantallas clonando hermanas, busca en librerias antes de crear |
| `/component-library-sync` | Write | Organizar componentes en Design System |
| `/variant-generator` | Write | Generar variantes desde props del codigo |
| `/figma-create-new-file` | Write | Crear un nuevo archivo Figma (Design o FigJam) |

### Sincronizacion
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/figma-sync` | Both | Orquestador bidireccional Figma ↔ Codigo |
| `/token-sync` | Write | Crear y aplicar design tokens. Soporta Extended Collections (Enterprise) |
| `/code-connect-bridge` | Write | Mapear componentes Figma → codigo. Templates parserless avanzados |
| `/design-system-rules-generator` | Write | Generar reglas para agentes AI + guidelines para Figma Make Kits |

### Calidad
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/drift-detection` | Read | Comparar Figma vs produccion. Enriquecido con Library Analytics (Enterprise) |
| `/figma-quality-gate` | Read | Validacion post-creacion. Integra Check Designs linter |
| `/design-system-health` | Read | Dashboard: auditoria + Library Analytics + Code Connect coverage |
| `/ui-framework-patterns` | Ref | Patrones CRUD por framework |

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                     FIGMA SYNC SYSTEM                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  NORMALIZER   │  │  SYNC AGENT  │  │   DRIFT      │       │
│  │  + PIPELINE   │  │              │  │   DETECTOR   │       │
│  │              │  │  Figma→Code  │  │              │       │
│  │  Audit       │  │  Code→Figma  │  │  Screenshots │       │
│  │  Cleanup     │  │  Bidireccional│  │  Comparacion │       │
│  │  Tokenize    │  │              │  │  Reportes    │       │
│  │  Auto Layout │  │              │  │  + Analytics │       │
│  │  Componentize│  │              │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │                │
│  ┌──────┴─────────────────┴──────────────────┴──────┐       │
│  │              CODE CONNECT BRIDGE                  │       │
│  │   Mapeo automatico: Figma Node ↔ Code Component  │       │
│  │   Templates parserless + MCP usage instructions   │       │
│  └──────────────────────┬───────────────────────────┘       │
│                          │                                    │
│  ┌───────────────────────┴─────────────────────────────┐    │
│  │               HERRAMIENTAS MCP (3 canales)            │    │
│  │                                                       │    │
│  │  figma-console-mcp     Figma Remote      GitNexus    │    │
│  │  (WebSocket:9223)      (REST API)        (Local)     │    │
│  │  ESCRITURA PRIMARIA    LECTURA +         ANALISIS    │    │
│  │                        ESCRITURA ALT.                 │    │
│  │                        (use_figma)                    │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  /figma-use (prerequisito obligatorio para escritura) │    │
│  │  17 reglas pre-flight + gotchas + 5 scripts JS helper │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**3 canales MCP:**
- **figma-console-mcp** (WebSocket): escritura primaria via Plugin API. Requiere Figma Desktop + Desktop Bridge
- **Figma Remote — use_figma** (HTTP REST): escritura alternativa via Plugin API. Sin Desktop Bridge. Beta, sera de pago
- **Figma Remote — lectura** (HTTP REST): metadata, screenshots, design context, Code Connect, search_design_system
- **GitNexus** (local, opcional): analisis de impacto en codigo

## Capacidades de Figma 2025-2026

| Feature | Plan Requerido | Skills que lo Usan |
|---------|---------------|-------------------|
| Extended Variable Collections (theming multi-brand) | Enterprise | `/token-sync`, `/normalization-pipeline` |
| Library Analytics API (uso de componentes) | Enterprise | `/drift-detection`, `/design-system-health` |
| Code Connect UI nativa + MCP usage instructions | Organization+ | `/code-connect-bridge` |
| Check Designs linter (raw values → variables) | Todos | `/figma-quality-gate`, `/design-normalizer` |
| use_figma (escritura via MCP oficial) | Todos (beta) | Todos los skills de escritura |

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| Plugin muestra punto amarillo | Cerrar y re-abrir Desktop Bridge |
| No conecta a Figma Desktop | `lsof -i :9223` — matar procesos zombi |
| Escrituras fallan, lecturas ok | Desktop Bridge no esta corriendo. Alternativa: usar `use_figma` |
| Conflicto de puerto | `kill $(lsof -t -i :9223)` y reiniciar Claude Code |
| Colores cambiaron al tokenizar | Los hex de las variables no coinciden con el diseno. Undo y re-escanear |
| use_figma no disponible | Verificar: `claude mcp add --transport http figma-remote https://mcp.figma.com/mcp` |
| Extended Collections falla | Requiere plan Enterprise. Fallback: usar modes (max 4 en Professional) |

## Adopcion en Proyectos Nuevos

Ver `docs/how-to-adopt.md` para la guia detallada.

## Proyectos Compatibles

Funciona con cualquier proyecto frontend y cualquier framework UI:
- React, Next.js, Vue, Nuxt, Svelte, Angular
- Ant Design, Material UI, Tailwind, Shadcn/ui, Chakra, Bootstrap
- CSS custom properties, Style Dictionary, cualquier sistema de tokens
