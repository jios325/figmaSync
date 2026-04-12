---
name: code-to-figma
description: "Captura paginas web de cualquier proyecto y las envia a Figma como frames de diseno. Soporta desktop (1440px) y mobile (375px) en un solo flujo. Maneja lazy load, Framer Motion, IntersectionObserver, y animaciones de entrada. Aplicable a cualquier stack: Next.js, Vite, Vue, Nuxt, Angular, Astro, plain HTML."
triggers:
  - "captura a figma"
  - "envia a figma"
  - "genera el diseño en figma"
  - "exporta a figma"
  - "figma desktop y mobile"
  - "version mobile en figma"
  - "version desktop en figma"
  - "capture to figma"
  - "send to figma"
  - "sync to figma"
  - "code to figma"
tools:
  - generate_figma_design
  - use_figma
  - get_screenshot
  - get_metadata
  - preview_start
  - preview_resize
  - preview_eval
  - preview_screenshot
---

# Code to Figma — Captura Multi-Viewport

Captura la UI renderizada de cualquier proyecto web y la envia como frames a Figma.
Soporta multiples viewports (desktop + mobile + tablet) en un solo flujo automatizado.

## Problema que resuelve

Las capturas web-to-figma fallan cuando la pagina usa:
- **Lazy load** (Framer Motion `whileInView`, `IntersectionObserver`, `loading="lazy"`)
- **Animaciones de entrada** (`opacity: 0` → `1` on scroll)
- **Viewport-dependent layouts** (responsive breakpoints)
- **Async data** (APIs, SSR hydration, skeleton loaders)

Este skill automatiza la solucion: inyecta scripts temporales que fuerzan
todo el contenido visible, hace scroll para activar lazy loads, y captura
en el viewport correcto.

## Viewports soportados

| Nombre    | Ancho   | Alto   | Metodo de apertura                              |
|-----------|---------|--------|------------------------------------------------|
| Desktop   | 1440px  | auto   | `open` (navegador default)                      |
| Mobile    | 375px   | 812px  | Chrome `--app` + `--user-data-dir` temporal     |
| Tablet    | 768px   | 1024px | Chrome `--app` + `--user-data-dir` temporal     |
| Custom    | {N}px   | {M}px  | Chrome `--app` + `--user-data-dir` temporal     |

## Pre-requisitos

1. **Figma Remote MCP conectado** — `generate_figma_design` disponible
   ```bash
   claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
   ```
2. **Dev server corriendo** — usar `preview_start` o verificar puerto
3. **Skill `/figma-use` cargado** — si se necesitan operaciones post-captura

## Flujo completo

### Fase 1: Preparacion

#### 1.1 Verificar dev server
```
Verificar con: lsof -i :<port>
O usar: preview_start (si hay .claude/launch.json configurado)
El server DEBE estar corriendo antes de cualquier captura.
```

#### 1.2 Detectar framework y layout file
Identificar donde inyectar el capture script segun el framework:

| Framework         | Archivo de layout                        | Sintaxis        |
|-------------------|------------------------------------------|-----------------|
| Next.js (App)     | `app/layout.tsx`                         | JSX             |
| Next.js (Pages)   | `pages/_document.tsx`                    | JSX             |
| Vite / React      | `index.html`                             | HTML            |
| Vue / Nuxt        | `app.vue` o `index.html`                | HTML/Vue        |
| Angular           | `src/index.html`                         | HTML            |
| Astro             | `src/layouts/Layout.astro`               | HTML            |
| SvelteKit         | `src/app.html`                           | HTML            |
| Plain HTML        | `index.html`                             | HTML            |

#### 1.3 Detectar lazy load
Buscar en el proyecto:
```
Grep: whileInView|viewport|IntersectionObserver
Grep: initial=.*opacity.*0
Grep: framer-motion|motion\.div|motion\.section
Grep: loading="lazy"|data-aos|data-scroll
Grep: gsap|ScrollTrigger|lenis
```

Si se encuentran → activar modo lazy-load (Fase 2).
Si NO se encuentran → saltar directo a Fase 3 (sin inyeccion de scripts extra).

### Fase 2: Inyeccion de scripts temporales

**SOLO si hay lazy load detectado.**

#### Para HTML puro (Vite, Angular, Vue, Astro, plain HTML):
Inyectar ANTES del cierre de `</body>`:

```html
<!-- Figma capture - TEMPORARY -->
<style>
  [style*="opacity: 0"], [style*="opacity:0"] {
    opacity: 1 !important;
    transform: none !important;
  }
</style>
<script>
  (async function() {
    await new Promise(r => setTimeout(r, 500));
    const totalHeight = document.body.scrollHeight;
    for (let pos = 0; pos <= totalHeight + 500; pos += 200) {
      window.scrollTo(0, pos);
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 1500));
    document.querySelectorAll('[style]').forEach(el => {
      if (el.style.opacity === '0') {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
    window.scrollTo(0, 0);
  })();
</script>
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
```

#### Para JSX (Next.js, React):
```jsx
{/* Figma capture - TEMPORARY */}
<style dangerouslySetInnerHTML={{ __html: `
  [style*="opacity: 0"], [style*="opacity:0"] {
    opacity: 1 !important;
    transform: none !important;
  }
`}} />
<script dangerouslySetInnerHTML={{ __html: `
  (async function() {
    await new Promise(r => setTimeout(r, 500));
    const totalHeight = document.body.scrollHeight;
    for (let pos = 0; pos <= totalHeight + 500; pos += 200) {
      window.scrollTo(0, pos);
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 1500));
    document.querySelectorAll('[style]').forEach(el => {
      if (el.style.opacity === '0') {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
    window.scrollTo(0, 0);
  })();
`}} />
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
```

**IMPORTANTE:** Marcar con comentario `TEMPORARY` para recordar eliminar despues.

#### Para paginas con GSAP/ScrollTrigger/AOS:
Agregar adicionalmente:
```html
<script>
  // Disable scroll-based animation libraries
  if (window.AOS) AOS.init({ disable: true });
  if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill());
</script>
```

### Fase 3: Captura Desktop (1440px)

```
1. Generar captureId:
   generate_figma_design({ outputMode: "existingFile", fileKey: "{fileKey}" })
   — o "newFile" si es un archivo nuevo

2. Abrir en navegador default (viewport desktop = ancho natural):
   open "http://localhost:{port}#figmacapture={captureId}&figmaendpoint=...&figmadelay=12000"

3. Esperar: sleep 20

4. Poll hasta completar:
   generate_figma_design({ captureId: "{captureId}" })
   Si "pending" → sleep 5 → reintentar
   Si "processing" → sleep 5 → reintentar
   Max 10 intentos antes de troubleshoot

5. Verificar con screenshot:
   get_screenshot({ fileKey, nodeId: "{nodeId retornado}" })
```

### Fase 4: Captura Mobile (375px)

**PROBLEMA:** El comando `open` reutiliza la ventana existente del navegador con su ancho
actual (generalmente 1440px+). NO se puede controlar el viewport con `open`.

**SOLUCION:** Usar Chrome en modo `--app` con un perfil temporal que fuerza la ventana.

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --user-data-dir=/tmp/chrome-mobile-capture \
  --window-size=375,812 \
  --app="http://localhost:{port}#figmacapture={captureId}&figmaendpoint=...&figmadelay=12000" &

# Linux
google-chrome \
  --user-data-dir=/tmp/chrome-mobile-capture \
  --window-size=375,812 \
  --app="http://localhost:{port}#figmacapture={captureId}&figmaendpoint=...&figmadelay=12000" &
```

**Flags criticos:**
| Flag                         | Proposito                                          |
|------------------------------|---------------------------------------------------|
| `--user-data-dir=/tmp/...`   | Perfil temporal, fuerza ventana nueva limpia        |
| `--window-size=375,812`      | Viewport mobile exacto                             |
| `--app=`                     | Modo app, sin barra de URL (viewport = window)     |

Para **tablet** (768px):
```bash
--window-size=768,1024
```

**IMPORTANTE:** Generar un captureId NUEVO para cada viewport.
Cada captureId es de un solo uso.

### Fase 5: Post-captura

#### 5.1 Renombrar frames
```javascript
// Via use_figma — cargar /figma-use primero
const desktop = await figma.getNodeByIdAsync("{desktopNodeId}");
if (desktop) desktop.name = "Desktop — 1440px";

const mobile = await figma.getNodeByIdAsync("{mobileNodeId}");
if (mobile) mobile.name = "Mobile — 375px";
```

#### 5.2 Limpiar capturas duplicadas
Si hubo intentos fallidos, eliminar frames sobrantes:
```javascript
const page = figma.currentPage;
const keep = new Set(["{desktopId}", "{mobileId}"]);
for (const child of [...page.children]) {
  if (!keep.has(child.id)) child.remove();
}
```

#### 5.3 Eliminar scripts temporales del codigo fuente
**CRITICO — NO OLVIDAR:** Remover TODO el bloque inyectado en Fase 2.
Buscar el comentario `TEMPORARY` y eliminar el bloque completo.
Verificar con `git diff` que solo se removio el bloque de captura.

#### 5.4 Limpiar perfil temporal de Chrome
```bash
rm -rf /tmp/chrome-mobile-capture
```

### Fase 6: Verificacion

1. `get_screenshot` del frame desktop → verificar todas las secciones visibles
2. `get_screenshot` del frame mobile → verificar layout responsive (1 columna, stacked)
3. Comparar contra `preview_screenshot` del dev server en el mismo viewport
4. Reportar al usuario con URLs directas a Figma

## Errores comunes y soluciones

| Error                                      | Causa                                    | Solucion                                           |
|--------------------------------------------|------------------------------------------|---------------------------------------------------|
| Captura queda en "pending"                 | Server caido o URL no cargo              | Verificar `lsof -i :<port>`, nuevo captureId       |
| Mobile captura version desktop             | `open` reuso ventana grande              | Usar Chrome `--user-data-dir` + `--app`            |
| Secciones vacias/transparentes             | Lazy load no se activo                   | Inyectar auto-scroll + CSS override                |
| Token MCP expirado                         | OAuth timeout                            | `mcp__figma-remote__authenticate` o reconectar     |
| Chrome ignora `--window-size`              | Reusa sesion existente                   | Siempre usar `--user-data-dir=/tmp/...` limpio     |
| Capture script no se ejecuta               | CSP bloquea script externo               | Usar Playwright approach (ver generate_figma_design)|
| Frame capturado muy alto (>10000px)        | Pagina con scroll infinito               | Usar `figmaselector=main` o selector especifico     |

## Parametros de delay recomendados

| Tipo de pagina            | figmadelay | sleep antes de poll |
|---------------------------|------------|---------------------|
| Pagina estatica simple    | 3000       | 8s                  |
| SPA con lazy load         | 8000       | 15s                 |
| SPA con animaciones heavy | 12000      | 20s                 |
| Dashboard con datos async | 15000      | 25s                 |
| SSR con hydration lenta   | 10000      | 18s                 |

## Captura de multiples rutas

Para capturar varias paginas del proyecto (ej: /, /about, /pricing):

```
1. Generar un captureId por ruta:
   captureHome = generate_figma_design({ outputMode: "existingFile", fileKey })
   captureAbout = generate_figma_design({ outputMode: "existingFile", fileKey })

2. Abrir cada ruta con su captureId:
   open "http://localhost:3000/#figmacapture={captureHome}..."
   open "http://localhost:3000/about#figmacapture={captureAbout}..."

3. Poll cada captureId por separado
```

## Flujo rapido (cheatsheet)

```
1. preview_start (o verificar server)
2. Detectar lazy load → inyectar scripts si necesario
3. generate_figma_design({ outputMode, fileKey }) → captureId desktop
4. open URL con captureId + figmadelay=12000
5. sleep 20 → poll captureId → get_screenshot → verificar
6. generate_figma_design({ outputMode, fileKey }) → captureId mobile
7. Chrome --app --window-size=375,812 --user-data-dir=/tmp/... URL
8. sleep 20 → poll captureId → get_screenshot → verificar
9. use_figma: renombrar frames ("Desktop — 1440px", "Mobile — 375px")
10. use_figma: limpiar duplicados
11. Eliminar scripts temporales del codigo
12. rm -rf /tmp/chrome-mobile-capture
```

## Output esperado

```
## Captura completada

### Desktop (1440px)
- Node: {nodeId}
- URL: https://www.figma.com/design/{fileKey}?node-id={nodeId}

### Mobile (375px)
- Node: {nodeId}
- URL: https://www.figma.com/design/{fileKey}?node-id={nodeId}

### Limpieza
- [x] Scripts temporales removidos de {archivo}
- [x] Perfil Chrome temporal eliminado
- [x] Frames duplicados eliminados ({N} removidos)
```

## Relacion con otros skills

| Skill                  | Cuando usar                                      |
|------------------------|--------------------------------------------------|
| `/figma-use`           | Cargar ANTES si se necesita post-procesamiento    |
| `/figma-sync`          | Orquestador padre — este skill es su sub-flujo    |
| `/token-sync`          | Despues de captura, para crear variables de color  |
| `/figma-quality-gate`  | Para validar calidad del frame capturado           |
| `/screen-creator`      | Para crear pantallas adicionales basadas en captura|
| `/drift-detection`     | Para comparar captura vs diseño existente          |
