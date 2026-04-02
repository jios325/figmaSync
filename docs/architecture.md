# Arquitectura del Sistema FigmaSync

## Principio Fundamental

FigmaSync no es una aplicacion — es un **conjunto de skills para Claude Code** que orquestan
herramientas MCP existentes (Figma Remote + GitNexus) para mantener disenos y codigo sincronizados.

No se instala nada. No hay servidor propio. Solo archivos `.md` que Claude Code interpreta como instrucciones.

## Componentes del Sistema

### 1. Design Normalizer Agent

**Responsabilidad:** Auditar y normalizar archivos de Figma para que sean "AI-ready".

**Herramientas MCP que usa:**
| Herramienta | Uso |
|---|---|
| `get_metadata` | Leer estructura completa del archivo (layers, nombres, posiciones) |
| `get_variable_defs` | Extraer tokens y variables actuales |
| `get_design_context` | Analizar componentes y sus propiedades |
| `create_design_system_rules` | Generar reglas formales del design system |
| `get_screenshot` | Capturar estado visual de referencia |

**Flujo:**
```
1. Lee metadata del archivo Figma (estructura de pages/frames)
2. Extrae variables y tokens definidos
3. Analiza naming conventions de layers
4. Detecta:
   - Componentes duplicados o casi-duplicados
   - Tokens hardcodeados (colores hex sueltos vs variables)
   - Artboards sin Auto Layout
   - Naming inconsistente
   - Variantes faltantes (hover, mobile, loading)
5. Genera reporte + reglas de design system
```

### 2. Bidirectional Sync Agent

**Responsabilidad:** Mantener Figma y codigo sincronizados en ambas direcciones.

**Herramientas MCP que usa:**
| Herramienta | Direccion | Uso |
|---|---|---|
| `get_design_context` | Figma→Code | Leer diseno y generar codigo |
| `generate_figma_design` | Code→Figma | Capturar UI y enviar a Figma |
| `get_code_connect_map` | Puente | Ver mapeo actual componentes |
| `get_screenshot` | Figma | Referencia visual del diseno |
| `gitnexus_impact` | Codigo | Evaluar impacto de cambios |
| `gitnexus_context` | Codigo | Ver dependencias de componentes |

**Flujo Figma → Code:**
```
1. Usuario comparte URL de Figma con node-id
2. get_design_context extrae codigo de referencia + screenshot
3. get_code_connect_map identifica componentes existentes
4. gitnexus_context verifica donde vive ese componente en el codigo
5. Genera/actualiza componente React reutilizando lo que existe
6. gitnexus_impact valida que el cambio no rompe dependientes
```

**Flujo Code → Figma:**
```
1. Levanta servidor local del proyecto (npm run dev)
2. generate_figma_design inicia captura
3. Selecciona paginas/elementos a capturar
4. Envia a archivo Figma existente (existingFile mode)
5. Frames capturados representan el estado real del codigo
```

### 3. Drift Detection Agent

**Responsabilidad:** Detectar diferencias entre lo que esta en Figma y lo que esta en produccion.

**Herramientas MCP que usa:**
| Herramienta | Uso |
|---|---|
| `get_screenshot` | Capturar frame de Figma |
| `generate_figma_design` | Capturar UI en vivo |
| `get_metadata` | Comparar estructura de layers |
| `get_variable_defs` | Comparar tokens definidos vs usados |
| `gitnexus_detect_changes` | Ver que cambio en codigo desde ultimo sync |

**Flujo:**
```
1. Para cada pagina/seccion critica del proyecto:
   a. Captura screenshot del frame en Figma (get_screenshot)
   b. Captura screenshot de produccion/staging (generate_figma_design)
   c. Compara visualmente (Claude analiza ambas imagenes)
   d. Extrae diferencias estructurales (metadata vs DOM)
2. Genera reporte de drift:
   - Componentes que cambiaron en codigo pero no en Figma
   - Disenos en Figma que nunca se implementaron
   - Tokens que difieren (colores, spacing, tipografia)
3. Prioriza por impacto usando gitnexus_impact
```

### 4. Code Connect Bridge

**Responsabilidad:** Mantener el mapeo automatico entre nodos de Figma y componentes de codigo.

**Herramientas MCP que usa:**
| Herramienta | Uso |
|---|---|
| `get_code_connect_suggestions` | Auto-detectar mapeos |
| `send_code_connect_mappings` | Confirmar y guardar mapeos |
| `add_code_connect_map` | Agregar mapeo individual |
| `get_code_connect_map` | Consultar mapeos existentes |
| `gitnexus_query` | Encontrar componentes en el codigo |
| `gitnexus_context` | Ver contexto completo de un componente |

**Flujo:**
```
1. Escanea archivo Figma buscando componentes (get_metadata)
2. Para cada componente, busca equivalente en codigo:
   a. get_code_connect_suggestions (auto-deteccion)
   b. Si no encuentra, gitnexus_query("NombreComponente")
3. Presenta sugerencias al usuario para confirmacion
4. send_code_connect_mappings guarda los mapeos confirmados
5. Proxima vez que se use get_design_context, usara componentes reales
```

## Flujo de Datos entre Agentes

```
                    ┌─────────────┐
                    │   USUARIO    │
                    │  (prompt)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  ORQUESTADOR │ ← skill: figma-sync/skill.md
                    │  (decide que │
                    │   agente usar)│
                    └──┬───┬───┬──┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          ▼                ▼                 ▼
   ┌─────────────┐ ┌─────────────┐  ┌──────────────┐
   │ NORMALIZER  │ │  SYNC AGENT │  │   DRIFT      │
   │             │ │             │  │   DETECTOR   │
   └──────┬──────┘ └──────┬──────┘  └──────┬───────┘
          │               │                │
          └───────┬───────┘                │
                  ▼                        │
          ┌──────────────┐                 │
          │ CODE CONNECT │◄────────────────┘
          │   BRIDGE     │
          └──────┬───────┘
                 │
          ┌──────▼──────┐
          │  MCP TOOLS   │
          │  (Figma +    │
          │   GitNexus)  │
          └─────────────┘
```

## Capacidades de escritura (Figma Remote MCP — `use_figma`)

Con `use_figma` (Figma Remote MCP), el sistema tiene **acceso completo de escritura** a Figma sin necesidad de Desktop Bridge:

| Operacion | Herramienta | Canal |
|-----------|-------------|-------|
| Crear paginas | `use_figma` (figma.createPage()) | Figma Remote (HTTP) |
| Mover frames entre paginas | `use_figma` (node.parent = page) | Figma Remote (HTTP) |
| Eliminar nodes | `use_figma` (node.remove()) | Figma Remote (HTTP) |
| Renombrar layers | `use_figma` (node.name = ...) | Figma Remote (HTTP) |
| Crear componentes | `use_figma` (figma.createComponent()) | Figma Remote (HTTP) |
| Instanciar componentes | `use_figma` (importComponentByKeyAsync()) | Figma Remote (HTTP) |
| Crear variables/tokens | `use_figma` (figma.variables.*) | Figma Remote (HTTP) |
| Resize nodes | `use_figma` (node.resize()) | Figma Remote (HTTP) |
| Set fills/strokes | `use_figma` (node.fills = ...) | Figma Remote (HTTP) |
| Clonar nodes | `use_figma` (node.clone()) | Figma Remote (HTTP) |
| Lint/audit de diseno | `figma_lint_design` | figma-console-mcp (opcional) |
| Capturar screenshots real-time | `figma_capture_screenshot` | figma-console-mcp (opcional) |

### Arquitectura de conexion

```
Figma Remote MCP (HTTP):
  use_figma(fileKey, code, description) → ejecuta JS Plugin API via HTTP
  No requiere Desktop Bridge ni Figma Desktop

figma-console-mcp (OPCIONAL, legacy):
  Solo aporta figma_lint_design y figma_capture_screenshot (real-time)
  Requiere Figma Desktop + Desktop Bridge plugin
```

## Limitaciones conocidas

1. La captura con `generate_figma_design` es de **web** unicamente (no mobile nativo)
2. Code Connect requiere que Figma tenga componentes bien definidos (no frames sueltos)
3. GitNexus necesita el indice actualizado (`npx gitnexus analyze`)
4. La comparacion visual depende de la capacidad multimodal de Claude (no es pixel-perfect)
5. `generate_figma_design` necesita que el servidor local este corriendo
6. `figma_lint_design` y `figma_capture_screenshot` solo disponibles con figma-console-mcp (opcional)
# Flujo de Ejecucion — Skills + MCP Tools

## Setup Minimo (sin Desktop Bridge)

```bash
# Solo necesitas esto:
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

Esto habilita: `use_figma` (escritura), `get_metadata`, `get_screenshot`, `get_design_context`, `get_variable_defs`, `search_design_system`, `get_code_connect_*`, `create_new_file`, `whoami`.

**Desktop Bridge es OPCIONAL.** Solo necesario si quieres `figma_lint_design` y `figma_capture_screenshot` (real-time).

## Flujo Completo: Normalizar una LIBRERIA

```
Usuario: "normaliza esta libreria: [URL de Figma]"

PASO 0 — DETECCION (figma-sync)
├── get_metadata(nodeId, fileKey)        ← MCP READ: estructura del archivo
├── Contar: symbols/components vs frames con width >= 1440
└── Resultado: TIPO = LIBRERIA (componentes > pantallas × 2)

PASO 1 — AUDITORIA (/design-normalizer)
├── get_metadata("pageId", fileKey)      ← MCP READ: estructura completa
├── use_figma(fileKey, scanColorsScript)  ← MCP WRITE: traverse nodos, extraer hex
├── get_variable_defs(nodeId, fileKey)    ← MCP READ: tokens existentes
├── get_screenshot(nodeId, fileKey)       ← MCP READ: referencia visual
└── OUTPUT: score 0-100, inventario colores, conteo componentes

PASO 2 — CONSOLIDAR DUPLICADOS
├── get_metadata por cada componente      ← MCP READ: comparar estructura
├── use_figma(fileKey, mergeScript)       ← MCP WRITE: combinar en component sets
└── use_figma(fileKey, renameScript)      ← MCP WRITE: "Property 1=Default" → "State=Default"

PASO 3 — TOKENIZACION (/token-sync)
├── use_figma(fileKey, scanAllFills)      ← MCP WRITE: escanear hex reales
├── use_figma(fileKey, createPrimitives)  ← MCP WRITE: crear coleccion Primitives
├── use_figma(fileKey, createSemantic)    ← MCP WRITE: crear coleccion Semantic con aliases
├── use_figma(fileKey, applyByContext)    ← MCP WRITE: aplicar variables por contexto
├── get_screenshot(nodeId, fileKey)       ← MCP READ: verificar que no cambio la apariencia
└── OUTPUT: colecciones creadas, % coverage

PASO 4 — AUTO LAYOUT
├── use_figma(fileKey, autoLayoutAtoms)   ← MCP WRITE: atoms (buttons, inputs)
├── use_figma(fileKey, autoLayoutMols)    ← MCP WRITE: molecules (cards, form fields)
├── use_figma(fileKey, autoLayoutOrgs)    ← MCP WRITE: organisms (headers, footers)
└── get_screenshot(nodeId, fileKey)       ← MCP READ: verificar no overlap

PASO 5 — REORGANIZAR ATOMIC DESIGN (/component-library-sync)
├── use_figma(fileKey, createPages)       ← MCP WRITE: crear paginas Atoms/Molecules/Organisms
├── use_figma(fileKey, moveComponents)    ← MCP WRITE: mover a pagina correcta
└── get_metadata(pageId, fileKey)         ← MCP READ: verificar organizacion

PASO 6 — VALIDACION (/figma-quality-gate)
├── get_metadata(nodeId, fileKey)         ← MCP READ: verificar estructura
├── get_screenshot(nodeId, fileKey)       ← MCP READ: verificar visual
└── OUTPUT: score final, issues pendientes
```

## Flujo Completo: Normalizar un PROYECTO

```
Usuario: "normaliza este proyecto: [URL de Figma]"

PASO 0 — DETECCION (figma-sync)
├── get_metadata(nodeId, fileKey)        ← MCP READ
└── Resultado: TIPO = PROYECTO (pantallas >= componentes)

PASO 1 — AUDITORIA (/design-normalizer)
├── get_metadata + use_figma(scan)       ← MCP READ + WRITE
└── OUTPUT: score 0-100

PASO 2 — LIMPIEZA ESTRUCTURAL
├── use_figma(fileKey, renameGenerics)   ← MCP WRITE: "Frame 123" → nombre semantico
├── use_figma(fileKey, flattenNesting)   ← MCP WRITE: aplanar grupos innecesarios
└── use_figma(fileKey, organizePages)    ← MCP WRITE: renombrar paginas

PASO 3 — TOKENIZACION (/token-sync)
├── use_figma(fileKey, scanHex)          ← MCP WRITE: escanear colores reales
├── use_figma(fileKey, createTokens)     ← MCP WRITE: Primitives + Semantic
├── use_figma(fileKey, applyTokens)      ← MCP WRITE: aplicar por contexto
└── get_screenshot(nodeId, fileKey)      ← MCP READ: verificar visual identico

PASO 4 — AUTO LAYOUT
├── use_figma(fileKey, autoLayout)       ← MCP WRITE: bottom-up
└── get_screenshot(nodeId, fileKey)      ← MCP READ: verificar

PASO 5 — COMPONENTIZACION (/component-library-sync)
├── search_design_system(query, fileKey) ← MCP READ: buscar en librerias publicadas
├── use_figma(fileKey, replaceWithLib)   ← MCP WRITE: reemplazar locals por instancias
├── use_figma(fileKey, organizeDS)       ← MCP WRITE: mover a pagina Design System
└── get_metadata(pageId, fileKey)        ← MCP READ: verificar

PASO 6 — VALIDACION (/figma-quality-gate)
├── get_metadata + get_screenshot        ← MCP READ
└── OUTPUT: score final
```

## Flujo: Implementar Diseno (Figma → Code)

```
Usuario: "implementa este frame: [URL de Figma]"

1. get_design_context(nodeId, fileKey)    ← MCP READ: codigo referencia + screenshot
2. search_design_system(query, fileKey)   ← MCP READ: componentes disponibles en libreria
3. get_code_connect_map(nodeId, fileKey)  ← MCP READ: mapeos componente → codigo
4. gitnexus_context(componentName)        ← LOCAL: dependencias en el codebase
5. [Generar/actualizar codigo]            ← Claude Code escribe archivos
6. gitnexus_impact(componentName)         ← LOCAL: verificar que no rompe nada
```

## Flujo: Capturar UI (Code → Figma)

```
Usuario: "actualiza Figma con lo que esta en produccion"

1. [Levantar servidor local]
2. generate_figma_design(outputMode)      ← MCP WRITE: inicia captura
3. [Usuario selecciona pantallas]
4. [Poll captureId hasta completar]       ← MCP READ
5. get_metadata(pageId, fileKey)          ← MCP READ: verificar frames creados
```

## Flujo: Crear Pantalla Nueva

```
Usuario: "crea la pantalla de Users"

1. get_metadata(pageId, fileKey)          ← MCP READ: encontrar pantalla hermana
2. search_design_system(query, fileKey)   ← MCP READ: componentes de libreria
3. use_figma(fileKey, cloneSister)        ← MCP WRITE: clonar pantalla hermana
4. use_figma(fileKey, updateContent)      ← MCP WRITE: cambiar titulo, breadcrumb, datos
5. get_screenshot(nodeId, fileKey)        ← MCP READ: verificar resultado
6. /figma-quality-gate                    ← Validacion
```

## Flujo: Detectar Drift

```
Usuario: "que diferencias hay entre Figma y produccion?"

1. get_metadata(pageId, fileKey)          ← MCP READ: inventario frames Figma
2. gitnexus_query("pages routes")         ← LOCAL: inventario rutas en codigo
3. get_screenshot(nodeId, fileKey)        ← MCP READ: screenshot de Figma
4. [Capturar screenshot produccion]       ← preview_screenshot o manual
5. get_variable_defs(nodeId, fileKey)     ← MCP READ: tokens Figma
6. [Leer tailwind.config]                 ← LOCAL: tokens codigo
7. gitnexus_detect_changes(scope)         ← LOCAL: cambios recientes
└── OUTPUT: reporte priorizado CRITICAL/HIGH/MEDIUM/LOW
```

## Flujo: Mapear Code Connect

```
Usuario: "mapea los componentes de Figma con el codigo"

1. get_metadata(nodeId, fileKey)                    ← MCP READ: listar componentes
2. get_code_connect_suggestions(nodeId, fileKey)    ← MCP READ: AI sugiere mapeos
3. get_context_for_code_connect(nodeId, fileKey)    ← MCP READ: propiedades del componente
4. gitnexus_query(componentName)                    ← LOCAL: buscar en codebase
5. [Presentar tabla al usuario para confirmar]
6. send_code_connect_mappings(mappings)             ← MCP WRITE: guardar mapeos
7. get_code_connect_map(nodeId, fileKey)             ← MCP READ: verificar
```

## Referencia Rapida: MCP Tools por Tipo

| Tipo | Tool | Canal |
|------|------|-------|
| **WRITE** | `use_figma(fileKey, code, desc)` | Figma Remote (HTTP) |
| **WRITE** | `figma_execute(code)` | Desktop Bridge (WebSocket) — opcional |
| **READ** | `get_metadata(nodeId, fileKey)` | Figma Remote |
| **READ** | `get_screenshot(nodeId, fileKey)` | Figma Remote |
| **READ** | `get_design_context(nodeId, fileKey)` | Figma Remote |
| **READ** | `get_variable_defs(nodeId, fileKey)` | Figma Remote |
| **READ** | `search_design_system(query, fileKey)` | Figma Remote |
| **READ** | `get_code_connect_map(nodeId, fileKey)` | Figma Remote |
| **READ** | `get_code_connect_suggestions(nodeId, fileKey)` | Figma Remote |
| **READ** | `get_context_for_code_connect(nodeId, fileKey)` | Figma Remote |
| **WRITE** | `send_code_connect_mappings(mappings)` | Figma Remote |
| **WRITE** | `add_code_connect_map(mapping)` | Figma Remote |
| **WRITE** | `create_new_file(planKey, fileName, type)` | Figma Remote |
| **WRITE** | `generate_figma_design(outputMode)` | Figma Remote |
| **READ** | `whoami()` | Figma Remote |
| **LOCAL** | `gitnexus_*` | GitNexus (opcional) |

# Flujo de Datos — FigmaSync

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FIGMA CLOUD                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Variables   │  │ Components  │  │  Artboards   │                │
│  │  & Tokens    │  │ & Variants  │  │  & Frames    │                │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘                │
│         │                 │                 │                        │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIGMA MCP SERVER (remoto)                        │
│                                                                     │
│  get_variable_defs  get_design_context  get_metadata                │
│  get_screenshot     generate_figma_design (↑ bidireccional)         │
│  create_design_system_rules                                         │
│  get_code_connect_*  send_code_connect_*                            │
└─────────────────────────────────────────────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SKILLS DE CLAUDE CODE                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐               │
│  │  figma-sync (orquestador)                        │               │
│  │                                                   │               │
│  │  Decide que agente activar segun el prompt:       │               │
│  │  - "normaliza este archivo" → normalizer          │               │
│  │  - "implementa este frame" → sync (figma→code)    │               │
│  │  - "actualiza figma con prod" → sync (code→figma) │               │
│  │  - "que cambio desde el ultimo sync" → drift      │               │
│  │  - "mapea los componentes" → code-connect         │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │
│  │ normalizer  │ │ sync-agent  │ │ drift-detect │ │ code-connect │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬───────┘ └──────┬───────┘ │
│         │               │               │                │         │
└─────────┼───────────────┼───────────────┼────────────────┼─────────┘
          │               │               │                │
          ▼               ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CODEBASE                                    │
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐                  │
│  │ Components │  │  Tailwind   │  │  GitNexus    │                  │
│  │ React/Vue  │  │  Config     │  │  Knowledge   │                  │
│  │            │  │  (tokens)   │  │  Graph       │                  │
│  └────────────┘  └────────────┘  └──────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Flujos Detallados

### Flujo A: Nueva Feature (Figma → Code)

```
Trigger: "Implementa este frame de Figma: [URL]"

1. [PARSE]     Extraer fileKey + nodeId de la URL
2. [CONTEXT]   get_design_context(nodeId, fileKey)
               → Recibe: codigo referencia, screenshot, metadata
3. [CONNECT]   get_code_connect_map(nodeId, fileKey)
               → Recibe: mapeo de componentes existentes en el codigo
4. [ANALYZE]   Si hay componentes mapeados:
               → gitnexus_context(componentName)
               → Ver donde vive, quien lo usa, que props tiene
5. [GENERATE]  Generar/actualizar componente React
               → Reutilizar componentes existentes del proyecto
               → Aplicar tokens de Tailwind config
               → Agregar traducciones i18n (es/en)
6. [IMPACT]    gitnexus_impact(componentName, "upstream")
               → Verificar que no se rompe nada
7. [VALIDATE]  Screenshot de localhost vs screenshot de Figma
               → Comparacion visual
```

### Flujo B: Actualizar Figma desde Produccion (Code → Figma)

```
Trigger: "Actualiza Figma con lo que esta en produccion"

1. [SERVER]    Levantar servidor local (npm run dev)
2. [CAPTURE]   generate_figma_design(outputMode: "existingFile",
               fileKey: "...", nodeId: "...")
               → Abre toolbar de captura
3. [SELECT]    Capturar pantallas/elementos relevantes
4. [POLL]      Poll captureId cada 5s hasta "completed"
5. [VERIFY]    Verificar que los frames se crearon en Figma
6. [REPORT]    Generar lista de paginas actualizadas
```

### Flujo C: Deteccion de Drift

```
Trigger: "Que diferencias hay entre Figma y produccion?"

1. [INVENTORY] get_metadata(pageId) → lista de frames en Figma
2. [CHANGES]   gitnexus_detect_changes(scope: "compare", base_ref: "main")
               → Que archivos/componentes cambiaron
3. [COMPARE]   Para cada frame/componente critico:
               a. get_screenshot(nodeId, fileKey) → imagen Figma
               b. Capturar produccion/staging
               c. Claude compara ambas imagenes
4. [TOKENS]    get_variable_defs → tokens en Figma
               vs. tailwind.config.ts → tokens en codigo
               → Detectar diferencias de colores, spacing, fonts
5. [REPORT]    Generar reporte priorizado:
               - CRITICAL: Componentes que difieren visualmente
               - WARNING: Tokens desincronizados
               - INFO: Frames sin implementar todavia
```

### Flujo D: Normalizacion de Archivo Figma

```
Trigger: "Normaliza este archivo de Figma: [URL]"

1. [SCAN]      get_metadata(pageId) → estructura completa
2. [TOKENS]    get_variable_defs → tokens actuales
3. [AUDIT]     Para cada page/frame:
               a. Verificar naming convention
               b. Detectar colores hardcodeados vs variables
               c. Verificar uso de Auto Layout
               d. Detectar componentes duplicados
               e. Verificar variantes (estados, responsive)
4. [RULES]     create_design_system_rules(languages, frameworks)
               → Generar reglas formales
5. [REPORT]    Generar reporte con:
               - Score de madurez del archivo (0-100)
               - Lista de issues priorizados
               - Recomendaciones especificas
               - Acciones automatizables vs manuales
```

### Flujo E: Code Connect Setup

```
Trigger: "Mapea los componentes de Figma con el codigo"

1. [DISCOVER]  get_metadata → listar componentes del archivo Figma
2. [SUGGEST]   get_code_connect_suggestions(nodeId, fileKey)
               → Sugerencias automaticas de mapeo
3. [SEARCH]    Para componentes sin sugerencia:
               gitnexus_query("NombreComponente")
               → Buscar en el knowledge graph
4. [PRESENT]   Mostrar tabla de mapeos al usuario:
               | Figma Component | Codigo | Confianza |
               |---|---|---|
               | Button/Primary | src/components/ui/Button | Alta |
               | ProductCard | src/components/ui/card/ProductCard | Alta |
               | ???Gallery | No encontrado | - |
5. [CONFIRM]   Usuario confirma/ajusta mapeos
6. [SAVE]      send_code_connect_mappings(mappings)
7. [VERIFY]    get_code_connect_map → verificar que se guardaron
```

## Datos que fluyen entre componentes

| Origen | Destino | Datos |
|---|---|---|
| Figma → Normalizer | Metadata XML, variables, screenshots |
| Normalizer → Reporte | Score, issues, recomendaciones |
| Figma → Sync Agent | Design context (codigo + screenshot + metadata) |
| Sync Agent → Codebase | Componentes React, traducciones, estilos |
| Codebase → Sync Agent | UI capturada (generate_figma_design) |
| Sync Agent → Figma | Frames editables en el archivo |
| Figma + Codebase → Drift | Screenshots, metadata, tokens |
| Drift → Reporte | Diferencias priorizadas por impacto |
| Figma + GitNexus → Bridge | Mapeos componente↔codigo |
| Bridge → Code Connect | Mappings persistidos en Figma |
# Referencia de Herramientas MCP para FigmaSync

## Figma Remote MCP (`mcp.figma.com`) — Canal Principal

### Setup
```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

### Herramienta de escritura principal: `use_figma`

`use_figma(fileKey, code, description)` ejecuta JS Plugin API via HTTP. Permite todas las operaciones de escritura sin necesidad de Desktop Bridge:

| Operacion | Codigo Plugin API |
|---|---|
| Crear paginas | `figma.createPage()` |
| Mover frames entre paginas | `page.appendChild(frame)` |
| Eliminar nodes | `node.remove()` |
| Renombrar layers | `node.name = '...'` |
| Crear componentes | `figma.createComponent()` |
| Instanciar componentes de libreria | `figma.importComponentByKeyAsync(key)` |
| Crear variables/tokens | `figma.variables.createVariableCollection()`, `figma.variables.createVariable()` |
| Resize nodes | `node.resize(w, h)` |
| Set fills/strokes | `node.fills = [...]`, `node.strokes = [...]` |
| Clonar nodes | `node.clone()` |
| Set texto | `textNode.characters = '...'` |

### Ejemplo: Crear pagina y mover frame
```javascript
// via use_figma:
await figma.loadAllPagesAsync();
const newPage = figma.createPage();
newPage.name = 'Feature Detail';

// Mover un frame a la nueva pagina
const frame = figma.getNodeById('612:2620');
if (frame) {
  newPage.appendChild(frame);
}
return { pageId: newPage.id, pageName: newPage.name };
```

### Ejemplo: Renombrar en batch
```javascript
// via use_figma:
const page = figma.currentPage;
const frames = page.children.filter(n => n.type === 'FRAME');
const renames = [];
for (const f of frames) {
  if (f.name.startsWith('feature/')) {
    const newName = f.name.replace('feature/', 'Feature/');
    f.name = newName;
    renames.push({ old: f.name, new: newName });
  }
}
return { renamed: renames.length, details: renames };
```

## figma-console-mcp (OPCIONAL, legacy)

Solo necesario para `figma_lint_design` (auditoria WCAG + calidad) y `figma_capture_screenshot` (screenshot real-time via plugin).

```bash
# Instalacion opcional:
claude mcp add figma-console -s user -e FIGMA_ACCESS_TOKEN=figd_XXX -e ENABLE_MCP_APPS=true -- npx -y figma-console-mcp@latest
```

Requiere Figma Desktop + Desktop Bridge plugin corriendo.

---

## Figma Remote MCP — Herramientas de Lectura

### Setup
```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

### Herramientas disponibles

#### `get_design_context` — La herramienta principal
**Proposito:** Obtener codigo de referencia + screenshot + metadata de un nodo Figma.
**Parametros:**
- `nodeId` (requerido): ID del nodo, ej. "123:456"
- `fileKey` (requerido): Key del archivo Figma (extraer de URL)
- `clientLanguages`: Lenguajes del proyecto, ej. "typescript,html,css"
- `clientFrameworks`: Frameworks, ej. "react,nextjs"
- `excludeScreenshot`: Omitir screenshot (no recomendado)
- `disableCodeConnect`: Desactivar Code Connect
- `forceCode`: Forzar generacion de codigo aunque sea muy grande

**Retorna:** Codigo React+Tailwind por defecto, screenshot, metadata, URLs de assets.

**Ejemplo de uso:**
```
Extraer fileKey y nodeId de:
https://figma.com/design/{fileKey}/{fileName}?node-id=1635-27981
→ fileKey: {fileKey}
→ nodeId: 1635:27981
```

---

#### `generate_figma_design` — Code → Canvas (BIDIRECCIONAL)
**Proposito:** Capturar UI en vivo y enviarla como frames editables a Figma.
**Parametros:**
- `outputMode`: "newFile" | "existingFile" | "clipboard"
- `fileKey`: Key del archivo destino (solo con existingFile)
- `nodeId`: Nodo donde insertar (opcional, crea nueva pagina si se omite)
- `fileName`: Nombre del archivo nuevo (solo con newFile)
- `planKey`: Team/org key (solo con newFile)
- `captureId`: ID para polling de estado

**Flujo:**
1. Llamar sin outputMode → recibe opciones disponibles
2. Llamar con outputMode elegido → inicia captura
3. Usar toolbar para capturar pantallas/elementos
4. Poll con captureId cada 5s hasta status "completed"

**IMPORTANTE:** Cada captureId es de un solo uso. Para multiples paginas, usar un captureId por pagina.

---

#### `get_metadata`
**Proposito:** Estructura XML del archivo (IDs, nombres, tipos, posiciones, tamanos).
**Uso:** Entender la estructura general antes de hacer operaciones especificas.
**Parametros:**
- `nodeId`: Puede ser page ID (ej. "0:1") para ver toda la pagina
- `fileKey`: Key del archivo

---

#### `get_variable_defs`
**Proposito:** Variables y tokens definidos en el archivo (colores, spacing, tipografia).
**Uso:** Auditar tokens, comparar con tokens del codigo (Tailwind config).
**Parametros:**
- `nodeId`, `fileKey`

---

#### `get_screenshot`
**Proposito:** Capturar screenshot de un nodo especifico.
**Uso:** Referencia visual para comparacion, documentacion, drift detection.
**Parametros:**
- `nodeId` (requerido), `fileKey` (requerido)

---

#### `create_design_system_rules`
**Proposito:** Generar archivo de reglas para que agentes AI sigan el design system.
**Parametros:**
- `clientLanguages`: ej. "typescript,html,css"
- `clientFrameworks`: ej. "react,nextjs"

**Retorna:** Template de reglas en markdown con:
- Ubicacion de componentes y naming
- Uso de tokens (nunca hardcodear colores)
- Approach de estilos y frameworks
- Convenciones de imports
- Manejo de assets

**Destino del archivo generado:**
- Claude Code → `CLAUDE.md`
- Cursor → `.cursor/rules/figma-design-system.mdc`
- Codex → `AGENTS.md`

---

#### `get_code_connect_suggestions`
**Proposito:** Auto-detectar mapeos entre nodos Figma y componentes de codigo.
**Uso:** Primer paso para establecer Code Connect.
**Flujo:** Llamar → revisar sugerencias con usuario → confirmar con send_code_connect_mappings.

---

#### `send_code_connect_mappings`
**Proposito:** Guardar mapeos Code Connect en bulk.
**Parametros:**
- `mappings`: Array de objetos con nodeId, componentName, source, label
- `nodeId`, `fileKey`

---

#### `add_code_connect_map`
**Proposito:** Agregar un mapeo individual.
**Parametros:**
- `nodeId`, `fileKey`, `source`, `componentName`, `label`
- `label`: "React" | "Vue" | "Svelte" | "Swift" | etc.

---

#### `get_code_connect_map`
**Proposito:** Consultar mapeos existentes.
**Retorna:** {nodeId: {codeConnectSrc, codeConnectName}}

---

#### `get_figjam`
**Proposito:** Convertir diagramas FigJam a XML con metadata.
**Uso:** Solo para archivos FigJam, no archivos de diseno.

---

#### `generate_diagram`
**Proposito:** Crear diagramas FigJam desde sintaxis Mermaid.
**Soporta:** Flowcharts, Gantt, sequence diagrams, state diagrams.

---

#### `whoami`
**Proposito:** Verificar identidad del usuario autenticado.
**Uso:** Debugging de permisos.

---

## GitNexus MCP (Code Intelligence)

### Herramientas relevantes para FigmaSync

#### `gitnexus_impact`
**Uso en FigmaSync:** Evaluar que se rompe antes de cambiar un componente.
```
gitnexus_impact({target: "BookingCard", direction: "upstream"})
→ Muestra todos los callers, paginas afectadas, nivel de riesgo
```

#### `gitnexus_context`
**Uso en FigmaSync:** Ver contexto completo de un componente (callers, callees, procesos).
```
gitnexus_context({name: "ImageGallery"})
→ Quien lo importa, que hooks usa, en que paginas aparece
```

#### `gitnexus_query`
**Uso en FigmaSync:** Encontrar componentes por concepto.
```
gitnexus_query({query: "product card component"})
→ Encuentra componentes relacionados con componentes relacionados
```

#### `gitnexus_detect_changes`
**Uso en FigmaSync:** Pre-commit, verificar que solo cambio lo esperado.
```
gitnexus_detect_changes({scope: "staged"})
→ Lista simbolos y flujos afectados por los cambios staged
```

## Extraer fileKey y nodeId de URLs de Figma

```
URL: https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}

Ejemplo:
https://figma.com/design/{fileKey}/{fileName}?node-id=1635-27981
                            ^^^^^^^^^^^^^^^^^^^^^^^^                       ^^^^^^^^^
                            fileKey                                        nodeId → 1635:27981

Nota: En la URL el nodeId usa "-" pero en los tools se usa ":"
      1635-27981 (URL) → 1635:27981 (parametro)
```

## Branch URLs

```
https://figma.com/design/{fileKey}/branch/{branchKey}/{fileName}
→ Usar branchKey como fileKey en los tools
```
