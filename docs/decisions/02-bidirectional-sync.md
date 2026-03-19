# Plan 02: Bidirectional Sync Agent

## Objetivo

Mantener sincronizados los disenos de Figma con el codigo en produccion, en ambas direcciones:
- **Figma → Code:** Implementar disenos nuevos usando componentes existentes del proyecto
- **Code → Figma:** Capturar el estado actual de produccion y enviarlo a Figma

## Problema que resuelve

1. Disenador crea frame en Figma → developer lo implementa → OK
2. Product pide ajuste directo en codigo → developer lo hace → Figma queda desactualizado
3. Nadie sabe cual es la "fuente de verdad" → Drift se acumula
4. Nuevo developer llega y no sabe si confiar en Figma o en produccion

## Prerequisitos

- Figma Remote MCP (`mcp.figma.com`)
- GitNexus indexado en el proyecto
- Servidor local funcional (`npm run dev` o equivalente)
- Code Connect configurado (o se configura como parte del flujo)

## Direccion 1: Figma → Code

### Flujo Detallado

```
ENTRADA: URL de Figma con node-id
         ej: https://figma.com/design/6fN8UlkT1fyrWh8rgAjBuw/...?node-id=1635-27981

PASO 1: PARSEAR URL
  - Extraer fileKey: "6fN8UlkT1fyrWh8rgAjBuw"
  - Extraer nodeId: "1635:27981"

PASO 2: OBTENER CONTEXTO DE DISENO
  Tool: get_design_context(nodeId, fileKey, {
    clientLanguages: "typescript,html,css",
    clientFrameworks: "react,nextjs"
  })
  Recibe:
  - Codigo de referencia (React + Tailwind por defecto)
  - Screenshot del frame
  - Metadata (dimensiones, properties)
  - URLs de assets (imagenes, iconos)

PASO 3: VERIFICAR CODE CONNECT
  Tool: get_code_connect_map(nodeId, fileKey)
  Si hay mapeos:
  → El codigo de referencia usa componentes reales del proyecto
  Si no hay mapeos:
  → El codigo es generico, necesita adaptacion

PASO 4: ANALIZAR CONTEXTO EN CODEBASE
  Tool: gitnexus_query("NombreComponente") o gitnexus_context("ComponenteExistente")
  Buscar:
  - Componentes similares que ya existen
  - Patrones de la pagina donde se insertara
  - Hooks y utils relevantes
  - Traducciones existentes (namespaces i18n)

PASO 5: GENERAR/ACTUALIZAR CODIGO
  Reglas:
  - Reutilizar componentes existentes del proyecto
  - No crear componentes nuevos si existe uno similar
  - Aplicar tokens del tailwind.config.ts (no hardcodear)
  - Agregar traducciones i18n para strings visibles
  - Seguir convenciones del proyecto (imports, naming, structure)

PASO 6: VALIDAR IMPACTO
  Tool: gitnexus_impact(componenteModificado, "upstream")
  Si riesgo HIGH/CRITICAL → advertir antes de modificar

PASO 7: VERIFICACION VISUAL
  - Levantar localhost
  - Capturar screenshot de la implementacion
  - Comparar con screenshot del frame de Figma
  - Ajustar si hay diferencias significativas
```

### Adaptacion por Proyecto

El agente debe leer el contexto del proyecto para adaptarse:

```
Para Example Project (Next.js 14 + TailwindCSS + next-intl):
- Componentes en src/components/ui/ o src/components/sections/
- Traducciones en src/locales/{en,es}/
- API calls con fetchAPI de @/api/utils
- Navegacion con Link de @/navigation
- Imagenes con next/image (solo WebP)

Para otro proyecto (Vue + Vuetify):
- Componentes en src/components/
- i18n con vue-i18n
- API calls con composables
- etc.
```

## Direccion 2: Code → Figma

### Flujo Detallado

```
ENTRADA: Comando "actualiza Figma con la version actual de [pagina/componente]"

PASO 1: PREPARAR SERVIDOR LOCAL
  - Verificar que npm run dev funciona
  - Esperar que el servidor este listo
  - Identificar URL de la pagina a capturar

PASO 2: DETERMINAR DESTINO EN FIGMA
  Opciones:
  a) Nuevo archivo: outputMode = "newFile"
     - Util para primer sync o documentacion
  b) Archivo existente: outputMode = "existingFile"
     - Necesita fileKey del archivo de Figma
     - Opcional: nodeId para insertar en pagina especifica
  c) Clipboard: outputMode = "clipboard"
     - Para pegar manualmente en cualquier archivo

PASO 3: INICIAR CAPTURA
  Tool: generate_figma_design({
    outputMode: "existingFile",
    fileKey: "6fN8UlkT1fyrWh8rgAjBuw",
    // nodeId: opcional, crea nueva pagina si se omite
  })
  Retorna: captureId + instrucciones de captura

PASO 4: CAPTURAR UI
  - Se abre toolbar de captura en el navegador
  - Capturar pantalla completa o elementos individuales
  - Para flujos multi-paso: capturar cada estado
  - Cada pagina necesita su propio captureId

PASO 5: POLL HASTA COMPLETAR
  Tool: generate_figma_design({ captureId: "..." })
  Repetir cada 5 segundos, maximo 10 intentos
  Hasta: status === "completed"

PASO 6: VERIFICAR EN FIGMA
  - Los frames capturados aparecen como nueva pagina o dentro del nodo especificado
  - Son completamente editables en Figma
  - Representan el estado real del codigo

PASO 7: DOCUMENTAR SYNC
  - Registrar fecha de ultimo sync
  - Registrar paginas/componentes sincronizados
  - Anotar diferencias detectadas
```

### Estrategia de Captura por Tipo

| Tipo de contenido | Estrategia |
|---|---|
| Landing page completa | Capturar pantalla completa en desktop + mobile |
| Componente aislado | Navegar a Storybook o pagina con el componente, capturar elemento |
| Flujo multi-paso | Capturar cada paso del flujo (ej: booking → seleccion → pago) |
| Header/Footer | Capturar como elementos individuales |
| Estados (hover, etc) | Usar preview_eval para trigger estados, capturar cada uno |

## Manejo de Conflictos

### Escenario: Ambos cambiaron

```
Figma tiene version A del componente
Codigo tiene version B (modificado despues del diseno)

Estrategia:
1. Detectar conflicto (drift detection)
2. Mostrar ambas versiones al usuario (screenshots)
3. Preguntar: "Cual es la correcta?"
   a) Figma es la fuente de verdad → actualizar codigo
   b) Codigo es la fuente de verdad → actualizar Figma
   c) Merge: tomar elementos de ambos
4. Ejecutar sync en la direccion elegida
```

### Escenario: Componente nuevo en codigo sin Figma

```
Developer creo componente que no existe en Figma

Estrategia:
1. Detectar con gitnexus_detect_changes (archivos nuevos)
2. Levantar localhost, navegar a pagina con el componente
3. generate_figma_design → enviar a Figma
4. Disenador refina el frame capturado
```

### Escenario: Frame en Figma sin implementar

```
Disenador creo frame que no se ha implementado

Estrategia:
1. Detectar con drift detection (frame sin Code Connect)
2. Reportar como "pendiente de implementacion"
3. Cuando se implemente, usar flujo Figma→Code normal
```

## Registro de Syncs

```markdown
# Sync Log — [Proyecto]

## 2026-03-18
| Pagina | Direccion | Estado | Notas |
|---|---|---|---|
| /hotels | Code→Figma | Completado | Nuevo banner promocional |
| /contact | Figma→Code | Completado | Rediseno de formulario |
| /booking | - | Drift detectado | Ver reporte #12 |
```

## Limitaciones

1. `generate_figma_design` solo captura **web** (no apps nativas)
2. Captura CSS-in-JS y Tailwind como estilos inline en Figma (no como variables)
3. Animaciones y transiciones no se capturan
4. Contenido dinamico (datos de API) se captura con los datos del momento
5. Dark mode requiere captura separada con media query
6. Formularios capturan estado actual (vacio, con datos, con errores) segun lo visible
