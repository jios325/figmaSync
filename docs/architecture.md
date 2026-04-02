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

## Capacidades de escritura (figma-console-mcp)

Con la adicion de figma-console-mcp, el sistema ahora tiene **acceso completo de escritura** a Figma:

| Operacion | Herramienta | Antes | Ahora |
|-----------|-------------|-------|-------|
| Crear paginas | `figma_execute` | Manual | Automatizado |
| Mover frames entre paginas | `figma_execute` | Manual | Automatizado |
| Eliminar nodes | `figma_delete_node` | Manual | Automatizado |
| Renombrar layers | `figma_rename_node` | Manual | Automatizado |
| Crear componentes | `figma_create_child` + `figma_execute` | Manual | Automatizado |
| Instanciar componentes | `figma_instantiate_component` | Manual | Automatizado |
| Crear variables/tokens | `figma_setup_design_tokens` | Manual | Automatizado |
| Lint/audit de diseno | `figma_lint_design` | Manual | Automatizado |
| Resize nodes | `figma_resize_node` | Manual | Automatizado |
| Set fills/strokes | `figma_set_fills` / `figma_set_strokes` | Manual | Automatizado |
| Clonar nodes | `figma_clone_node` | Manual | Automatizado |
| Capturar screenshots | `figma_capture_screenshot` | Solo REST | Plugin (real-time) |

### Arquitectura de conexion

```
figma-console-mcp usa DOS canales:
  1. REST API (via PAT token) → LECTURA: file data, components, styles
  2. Desktop Bridge Plugin (via WebSocket) → ESCRITURA: Plugin API completo

El Plugin API de Figma tiene acceso TOTAL al documento:
  - figma.createFrame(), figma.createText(), figma.createComponent()
  - node.remove(), node.name =, node.resize()
  - figma.root.children (pages), figma.currentPage
  - figma.variables.*, figma.teamLibrary.*
```

## Canal de Escritura Alternativo: use_figma (MCP Oficial)

Desde 2026, Figma abrio el canvas a agentes AI via `use_figma`, un tool del MCP Server oficial que ejecuta JavaScript del Plugin API via HTTP — sin requerir Desktop Bridge.

**Arquitectura actualizada (3 canales):**
```
Figma Desktop <--WebSocket:9223--> figma-console-mcp <--> Claude Code  (ESCRITURA PRIMARIA)
Figma Cloud  <--HTTP REST--------> use_figma         <--> Claude Code  (ESCRITURA ALTERNATIVA)
PAT Token    --> REST API --------> Figma Cloud       <--> Claude Code  (LECTURA)
```

**Seleccion automatica:** El orquestador (`figma-sync`) detecta el canal disponible antes de cada sesion:
1. `figma_get_status` OK → figma-console-mcp (primario)
2. Else `use_figma` disponible → use_figma (fallback)
3. Else → modo read-only

**Parametros de use_figma:** `use_figma(fileKey, code, description)` — ejecuta JS del Plugin API. Equivale a `figma_execute` pero sin Desktop Bridge.

Ver `docs/decisions/05-official-mcp-write-channel.md` para la comparacion completa.

## Capacidades Nuevas (2025-2026)

### Extended Variable Collections (Theming)
- Colecciones de variables se pueden "extender" para crear temas multi-brand
- `figma.variables.extendLibraryCollectionByKeyAsync(collectionKey, name)`
- `variable.valuesByModeForCollectionAsync(collection)` para leer valores por tema
- **Solo Enterprise.** Fallback: usar modes en una coleccion (max 4 en Professional)

### Library Analytics API
- API REST con 6 endpoints: components/styles/variables x actions/usages
- Datos de uso: instancias, detachments, inserciones por componente
- Scope requerido: `library_analytics:read`. **Solo Enterprise.**
- Usado por `/drift-detection` y `/design-system-health`

### Code Connect UI Nativa
- UI integrada en Figma con conexion directa a GitHub
- AI sugiere mapeos. Genera snippets automaticos
- Nuevo campo: **MCP usage instructions** para LLMs
- **Organization y Enterprise.** Nuestro `/code-connect-bridge` complementa para bulk/automatizacion

### Check Designs Linter
- Linter nativo que detecta valores raw que deberian ser variables
- Modelo AI sugiere la variable correcta por contexto
- Complementa `figma_lint_design` (API). Referenciado en `/figma-quality-gate`

## Limitaciones conocidas

1. **figma-console-mcp** requiere Figma Desktop (no web app) con el plugin corriendo
2. La captura con `generate_figma_design` es de **web** unicamente (no mobile nativo)
3. Code Connect requiere que Figma tenga componentes bien definidos (no frames sueltos)
4. GitNexus necesita el indice actualizado (`npx gitnexus analyze`)
5. La comparacion visual depende de la capacidad multimodal de Claude (no es pixel-perfect)
6. `generate_figma_design` necesita que el servidor local este corriendo
7. El plugin Desktop Bridge debe estar abierto en el archivo Figma que se quiere editar
8. Solo UN archivo Figma activo por conexion WebSocket (cambiar con `figma_navigate`)
9. **use_figma** esta en beta — sera de pago. No tiene lint ni screenshots real-time
10. **Extended Variable Collections** solo disponible en plan Enterprise
11. **Library Analytics API** solo disponible en plan Enterprise
12. **Code Connect UI nativa** requiere plan Organization o Enterprise
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

## Figma Console MCP (`figma-console-mcp`) — ESCRITURA

### Setup
```bash
claude mcp add figma-console -s user -e FIGMA_ACCESS_TOKEN=figd_XXX -e ENABLE_MCP_APPS=true -- npx -y figma-console-mcp@latest
```

### Plugin Desktop Bridge
- Importar en Figma Desktop: Plugins > Development > Import plugin from manifest
- Manifest: `npx figma-console-mcp@latest --print-path` → `figma-desktop-bridge/manifest.json`
- Conexion via WebSocket en puertos 9223-9232 (multi-instancia)

### Herramientas de escritura (59+ disponibles)

#### Operaciones sobre nodes
| Herramienta | Funcion |
|---|---|
| `figma_execute` | Ejecutar JS arbitrario en contexto del plugin (crear paginas, mover nodes entre paginas) |
| `figma_create_child` | Crear RECTANGLE, ELLIPSE, FRAME, TEXT, LINE dentro de un parent |
| `figma_delete_node` | Eliminar un node |
| `figma_rename_node` | Renombrar un node |
| `figma_move_node` | Mover un node a posicion x,y |
| `figma_resize_node` | Redimensionar un node |
| `figma_clone_node` | Duplicar un node |
| `figma_set_text` | Cambiar texto de un text node |
| `figma_set_fills` | Cambiar colores de fill |
| `figma_set_strokes` | Cambiar bordes |
| `figma_set_image_fill` | Aplicar imagen como fill (base64 o path) |

#### Componentes
| Herramienta | Funcion |
|---|---|
| `figma_instantiate_component` | Instanciar un componente del design system |
| `figma_search_components` | Buscar componentes por nombre/categoria |
| `figma_get_component_details` | Detalles de un componente (variantes, props) |
| `figma_set_instance_properties` | Cambiar props de una instancia |
| `figma_add_component_property` | Agregar propiedad a un componente |
| `figma_arrange_component_set` | Reorganizar component set con grid |

#### Variables y tokens
| Herramienta | Funcion |
|---|---|
| `figma_setup_design_tokens` | Crear coleccion + modes + variables en UNA llamada |
| `figma_batch_create_variables` | Crear hasta 100 variables a la vez |
| `figma_batch_update_variables` | Actualizar hasta 100 valores a la vez |
| `figma_create_variable` | Crear una variable individual |
| `figma_update_variable` | Actualizar un valor |
| `figma_delete_variable` | Eliminar variable |
| `figma_create_variable_collection` | Crear coleccion vacia |
| `figma_add_mode` | Agregar modo (Light/Dark) |

#### Lectura y validacion
| Herramienta | Funcion |
|---|---|
| `figma_get_status` | Verificar conexion WebSocket |
| `figma_get_selection` | Nodos seleccionados por el usuario |
| `figma_get_design_changes` | Cambios recientes en el documento |
| `figma_capture_screenshot` | Screenshot via plugin (estado real, no cache) |
| `figma_take_screenshot` | Screenshot via REST API |
| `figma_get_file_data` | Arbol del documento con profundidad controlada |
| `figma_lint_design` | Audit WCAG + calidad de diseno |
| `figma_get_variables` | Leer variables con resolucion de aliases |
| `figma_get_styles` | Leer estilos (color, texto, efectos) |
| `figma_get_design_system_kit` | Tokens + componentes + estilos en UNA llamada |
| `figma_get_design_system_summary` | Resumen compacto del design system |

#### Comentarios
| Herramienta | Funcion |
|---|---|
| `figma_get_comments` | Leer comentarios del archivo |
| `figma_post_comment` | Postear comentario (pinned a un node) |
| `figma_delete_comment` | Eliminar comentario |

#### Consola y debugging
| Herramienta | Funcion |
|---|---|
| `figma_get_console_logs` | Logs del plugin |
| `figma_watch_console` | Stream de logs en real-time |
| `figma_reload_plugin` | Recargar plugin |
| `figma_reconnect` | Forzar reconexion |

### Ejemplo: Crear pagina y mover frame
```javascript
// figma_execute:
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
// figma_execute:
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

---

## Figma Remote MCP (`mcp.figma.com`)

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
