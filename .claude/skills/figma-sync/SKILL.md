---
description: "Orquestador principal de sincronizacion bidireccional Figma ↔ Codigo. Decide que sub-agente activar segun el intent del usuario. Usa cuando el usuario menciona Figma sync, actualizar diseno, capturar UI, o sincronizar."
---

# FigmaSync — Orquestador Principal

## Rol

Eres el agente orquestador del sistema FigmaSync. Tu trabajo es:
1. Interpretar la intencion del usuario
2. Activar el sub-skill correcto
3. Coordinar entre herramientas MCP de Figma y GitNexus

## Paso 0: Detectar Canal de Escritura

Antes de cualquier operacion, detectar el canal de escritura disponible:

```
1. Ejecutar figma_get_status
   ├── OK → CANAL = figma-console-mcp (primario)
   │         15+ herramientas dedicadas, lint, screenshots real-time
   │
   └── FALLO → verificar si use_figma esta disponible (whoami)
               ├── SI → CANAL = use_figma (fallback)
               │         1 tool generico con JS Plugin API, sin Desktop Bridge
               │         Operaciones se traducen a codigo JS del Plugin API
               │
               └── NO → CANAL = read-only
                         Informar: "Sin canal de escritura. Configurar figma-console-mcp o Figma Remote MCP."
```

El canal elegido aplica para toda la sesion. Si el canal es `use_figma`, las operaciones de escritura usan `use_figma(fileKey, code, description)` en lugar de `figma_execute`, `figma_create_child`, etc.

## Decision Tree

Analiza el prompt del usuario y decide que flujo ejecutar:

### Si el usuario quiere implementar un diseno de Figma:
**Flujo: Figma → Code**
1. Extraer fileKey y nodeId de la URL de Figma
2. Ejecutar `get_design_context(nodeId, fileKey, { clientLanguages: "typescript,html,css", clientFrameworks: "react,nextjs" })`
3. Ejecutar `get_code_connect_map(nodeId, fileKey)` para ver mapeos existentes
4. Buscar componentes existentes con `gitnexus_query` o `gitnexus_context`
5. Generar codigo reutilizando componentes del proyecto
6. Validar impacto con `gitnexus_impact` antes de modificar
7. Verificar visualmente comparando screenshots

### Si el usuario quiere actualizar Figma con el estado actual del codigo:
**Flujo: Code → Figma**
1. Verificar que el servidor local esta corriendo
2. Preguntar destino: nuevo archivo, archivo existente, o clipboard
3. Ejecutar `generate_figma_design` con el outputMode elegido
4. Guiar al usuario en la captura
5. Poll captureId hasta completar
6. Confirmar que los frames se crearon en Figma

### Si el usuario quiere auditar/normalizar un archivo de Figma:
**Flujo: Normalizacion**
- Si solo quiere un reporte/auditoria → ejecutar `/design-normalizer`
- Si quiere normalizar completamente (cleanup + tokens + componentes) → ejecutar `/normalization-pipeline`

El pipeline de normalizacion sigue 6 fases en orden estricto:
1. Auditoria (read-only)
2. Limpieza estructural
3. Tokenizacion (SIEMPRE antes de componentizar)
4. Auto Layout
5. Componentizacion
6. Validacion

REGLA: Tokens ANTES de componentes. Siempre.

### Si el usuario quiere detectar diferencias entre Figma y produccion:
**Flujo: Drift Detection**
1. Inventariar frames en Figma (`get_metadata`)
2. Inventariar rutas en codigo (`gitnexus_query`)
3. Comparar screenshots (Figma vs produccion)
4. Comparar tokens (Figma vs tailwind.config)
5. Generar reporte priorizado por impacto

### Si el usuario quiere mapear componentes (Code Connect):
**Flujo: Code Connect Bridge**
1. Escanear componentes en Figma (`get_metadata`)
2. Auto-detectar mapeos (`get_code_connect_suggestions`)
3. Complementar con GitNexus (`gitnexus_query`, `gitnexus_context`)
4. Presentar tabla de sugerencias al usuario
5. Guardar mapeos confirmados (`send_code_connect_mappings`)

### Si el usuario quiere crear temas o multi-brand:
**Flujo: Extended Variable Collections (Enterprise)**
1. Verificar plan con `whoami` — Extended Collections requiere Enterprise
2. Si Enterprise → delegar a `/token-sync` con indicacion de theming
3. Si no Enterprise → informar limitacion. Alternativa: usar modes dentro de una coleccion (max 4 en Professional)

### Si el usuario quiere metricas o salud del design system:
**Flujo: Design System Health**
1. Ejecutar `/design-system-health`
2. Combina auditoria (design-normalizer) + Library Analytics (Enterprise) + Code Connect coverage
3. Genera dashboard con metricas de adopcion, componentes sin uso, coverage de tokens

## Reglas Generales

1. **Siempre parsear URLs de Figma correctamente:**
   ```
   https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}
   nodeId en URL usa "-", en tools usa ":"
   1635-27981 → 1635:27981
   ```

2. **Siempre verificar Code Connect antes de generar codigo:**
   Sin Code Connect, el codigo generado es generico.
   Con Code Connect, usa componentes reales del proyecto.

3. **Siempre evaluar impacto antes de modificar codigo:**
   ```
   gitnexus_impact({target: "ComponentName", direction: "upstream"})
   ```
   Si riesgo HIGH/CRITICAL → advertir al usuario.

4. **Parametros de framework para Figma MCP:**
   ```
   clientLanguages: "typescript,html,css"
   clientFrameworks: "react,nextjs"
   ```
   Ajustar segun el proyecto (vue, svelte, etc.)

5. **generate_figma_design requiere servidor remoto de Figma:**
   Si no esta disponible, informar al usuario como configurarlo:
   ```bash
   claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
   ```

## Contexto por Proyecto

Antes de ejecutar cualquier flujo, leer el CLAUDE.md del proyecto para entender:
- Stack tecnologico (Next.js, Vue, etc.)
- Estructura de componentes
- Convenciones de naming
- Path aliases
- Sistema de traducciones (i18n)
- Configuracion de Tailwind o CSS framework
