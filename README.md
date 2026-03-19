# FigmaSync

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo.
No es una app — son skills que Claude Code interpreta para operar sobre Figma.
Funciona con **cualquier** proyecto, framework o libreria UI.

## Prerequisitos

- [Claude Code](https://claude.ai/code) instalado
- Figma Desktop (NO web app)
- Figma Personal Access Token (PAT)
- Plugin Desktop Bridge corriendo en Figma (punto verde)

## Quick Start

```bash
# 1. Copiar skills a tu proyecto
cp -r .claude/skills/ ~/tu-proyecto/.claude/skills/

# 2. Configurar figma-console-mcp (escritura)
claude mcp add figma-console -- npx -y figma-console-mcp@latest

# 3. Configurar Figma Remote (lectura via REST API)
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp

# 4. Abrir Desktop Bridge en tu archivo Figma → verificar punto verde

# 5. Auditar el archivo
/design-normalizer
```

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
Extrae los colores **reales del diseno** (no del codigo), crea colecciones Primitives + Semantic, y aplica variables a todos los nodos. La apariencia visual NO cambia.

### Paso 4: Auto Layout
```
/normalization-pipeline  (fase 3)
```
Convierte layouts de posicion absoluta a Auto Layout (Flexbox). Bottom-up: atomos → contenedores → secciones → paginas.

### Paso 5: Componentizacion
```
/component-library-sync
```
Identifica patrones repetidos, extrae componentes, crea pagina Design System, reemplaza copias con instancias.

### Paso 6: Validacion
```
/figma-quality-gate
```
Verifica naming, Auto Layout, tokens, consistencia. Score objetivo: >80/100.

> **REGLA:** Tokens ANTES de componentes. Siempre.
> **REGLA:** Fuente de verdad de colores = el diseno, NUNCA el codigo.
> **REGLA:** Checkpoint visual despues de cada paso. Si algo se ve mal → Cmd+Z.
> **REGLA:** Mismo hex ≠ mismo significado. Revisar componente por componente despues del batch-apply.
> **REGLA:** NUNCA borrar colecciones sin limpiar bindings primero. Preferir undo.
> **REGLA:** Copiar componentes locales como referencia ANTES de tokenizar para comparar despues.

## Errores Comunes en Tokenizacion

| Error | Causa | Prevencion |
|-------|-------|------------|
| Colores no coinciden con el diseno | Se usaron colores del codigo en vez del archivo Figma | SIEMPRE escanear hex reales del archivo |
| Nodos se ven negros/oscuros | Se borraron colecciones y quedaron bindings huerfanas | Hacer undo en vez de borrar+recrear |
| Mismo color aplicado donde no debe | Batch-apply por hex no distingue contexto semantico | Revisar cada componente post-aplicacion |
| Cuadros negros en placeholders | Fills tipo IMAGE no detectados (solo se buscaron SOLID) | Buscar todos los fill types, no solo SOLID |
| Texto invisible en botones hover | Texto y fondo del mismo color | Verificar contraste en variantes hover/active |
| Dark mode innecesario | Se crearon modes Light+Dark sin necesidad | Solo Light mode salvo indicacion explicita |

## Todos los Skills (11)

| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/normalization-pipeline` | Write | Pipeline completo de normalizacion (6 fases) |
| `/design-normalizer` | Read | Auditoria con score 0-100 |
| `/token-sync` | Write | Crear y aplicar design tokens |
| `/component-library-sync` | Write | Organizar componentes en Design System |
| `/screen-creator` | Write | Crear pantallas clonando hermanas |
| `/variant-generator` | Write | Generar variantes desde props del codigo |
| `/figma-sync` | Both | Orquestador bidireccional Figma ↔ Codigo |
| `/code-connect-bridge` | Write | Mapear componentes Figma → codigo |
| `/drift-detection` | Read | Comparar Figma vs produccion |
| `/figma-quality-gate` | Read | Validacion post-creacion |
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
│  │  Auto Layout │  │              │  │              │       │
│  │  Componentize│  │              │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │                │
│  ┌──────┴─────────────────┴──────────────────┴──────┐       │
│  │              CODE CONNECT BRIDGE                  │       │
│  │   Mapeo automatico: Figma Node ↔ Code Component  │       │
│  └──────────────────────┬───────────────────────────┘       │
│                          │                                    │
│  ┌───────────────────────┴─────────────────────────────┐    │
│  │               HERRAMIENTAS MCP (3 capas)             │    │
│  │                                                       │    │
│  │  figma-console-mcp     Figma Remote      GitNexus    │    │
│  │  (WebSocket:9223)      (REST API)        (Local)     │    │
│  │  ESCRITURA             LECTURA           ANALISIS    │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

- **figma-console-mcp** (WebSocket): operaciones de escritura via Plugin API
- **Figma Remote** (HTTP REST): operaciones de lectura via PAT token
- **GitNexus** (local, opcional): analisis de impacto en codigo

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| Plugin muestra punto amarillo | Cerrar y re-abrir Desktop Bridge |
| No conecta a Figma Desktop | `lsof -i :9223` — matar procesos zombi |
| Escrituras fallan, lecturas ok | Desktop Bridge no esta corriendo |
| Conflicto de puerto | `kill $(lsof -t -i :9223)` y reiniciar Claude Code |
| Colores cambiaron al tokenizar | Los hex de las variables no coinciden con el diseno. Undo y re-escanear |

## Adopcion en Proyectos Nuevos

Ver `docs/how-to-adopt.md` para la guia detallada.

## Proyectos Compatibles

Funciona con cualquier proyecto frontend y cualquier framework UI:
- React, Next.js, Vue, Nuxt, Svelte, Angular
- Ant Design, Material UI, Tailwind, Shadcn/ui, Chakra, Bootstrap
- CSS custom properties, Style Dictionary, cualquier sistema de tokens
