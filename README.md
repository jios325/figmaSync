# FigmaSync

Toolkit de agentes AI para sincronizacion bidireccional Figma <-> Codigo, con inteligencia de diseno integrada.
No es una app — son **23 skills** que Claude Code interpreta para operar sobre Figma con criterio profesional de UI/UX.
Funciona con **cualquier** proyecto, framework o libreria UI.

Incluye [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): 161 reglas de razonamiento, 67 estilos UI, 161 paletas de color, 57 pares tipograficos y 99 guidelines UX.

## Quick Start

```bash
# 1. Copiar skills a tu proyecto
cp -r .claude/skills/ ~/tu-proyecto/.claude/skills/

# 2. Configurar Figma Remote MCP (lectura + escritura)
#    Ver seccion "Autenticacion del MCP" abajo para obtener el token OAuth
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp \
  --header "Authorization: Bearer TU_TOKEN_OAUTH"

# 3. Listo. Auditar el archivo:
/figma-sync audita esta libreria: [URL de Figma]
```

> **Desktop Bridge es OPCIONAL.** Con solo el paso 2 ya puedes leer y escribir en Figma via `use_figma`.

---

## Autenticacion del MCP

El Figma MCP Server requiere **OAuth**, no Personal Access Tokens. Los Personal Access Tokens (`figd_...`) solo funcionan con la REST API directa (`api.figma.com`) usando el header `X-Figma-Token`, pero el MCP (`mcp.figma.com/mcp`) necesita un token OAuth (`figu_...`) con el header `Authorization: Bearer`.

### Paso 1 — Generar un Personal Access Token (necesario para verificar tu cuenta)

1. Ve a [figma.com/settings](https://www.figma.com/settings) → seccion **Personal access tokens**
2. Click **Generate new token** → activa todos los scopes → copia el token (`figd_...`)

### Paso 2 — Obtener el token OAuth via flujo automatizado

El MCP usa OAuth con registro dinamico de clientes. Ejecuta estos comandos en orden:

```bash
# 2a. Registrar cliente OAuth (una sola vez)
curl -s -X POST 'https://api.figma.com/v1/oauth/mcp/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Claude Code FigmaSync",
    "redirect_uris": ["http://localhost:9274/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "client_secret_post"
  }'
# Guarda el client_id y client_secret que retorna
```

```bash
# 2b. Generar PKCE challenge
CODE_VERIFIER=$(python3 -c "import secrets; print(secrets.token_urlsafe(64)[:128])")
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr '+/' '-_' | tr -d '=')
STATE=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
```

```bash
# 2c. Levantar servidor callback temporal
python3 -c "
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        code = params.get('code', [''])[0]
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(f'<h1>Autorizado!</h1><p>Code: <b>{code}</b></p>'.encode())
        print(f'AUTH_CODE={code}')

HTTPServer(('localhost', 9274), Handler).handle_request()
" &
```

```bash
# 2d. Abrir URL de autorizacion en el navegador (reemplazar CLIENT_ID, STATE, CODE_CHALLENGE)
open "https://www.figma.com/oauth/mcp?client_id=CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A9274%2Fcallback&response_type=code&scope=mcp%3Aconnect&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

# Autoriza en Figma → el servidor captura el AUTH_CODE
```

```bash
# 2e. Intercambiar codigo por token OAuth (reemplazar AUTH_CODE, CLIENT_ID, CLIENT_SECRET, CODE_VERIFIER)
curl -s -X POST 'https://api.figma.com/v1/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code&code=AUTH_CODE&redirect_uri=http://localhost:9274/callback&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&code_verifier=$CODE_VERIFIER"

# Retorna: { "access_token": "figu_...", "refresh_token": "figur_...", "expires_in": 7776000 }
```

### Paso 3 — Configurar el MCP con el token OAuth

```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp \
  --header "Authorization: Bearer figu_TU_TOKEN_OAUTH"
```

### Renovar el token (expira en 90 dias)

```bash
curl -s -X POST 'https://api.figma.com/v1/oauth/refresh' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=CLIENT_ID&client_secret=CLIENT_SECRET&refresh_token=figur_TU_REFRESH_TOKEN"
```

> **Tip:** Guarda el `client_id`, `client_secret` y `refresh_token` en un lugar seguro. Solo necesitas registrar el cliente una vez — para renovar solo necesitas el refresh token.

---

## Casos de Uso (Prompts de Ejemplo)

### Normalizar una libreria de componentes

```
/figma-sync normaliza esta libreria usando Atomic Design:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=212-6455

Prioridades:
- Consolidar buttons duplicados en 1 component set
- Consolidar headers en variantes
- Renombrar "Property 1=Default" a nombres semanticos
- Organizar: Atoms (buttons, inputs, icons), Molecules (cards, tags), Organisms (headers, footers)
```

**Que hace:** Detecta que es una libreria (mas componentes que pantallas) → audita → consolida duplicados → tokeniza colores → aplica Auto Layout → reorganiza por Atomic Design → valida.

### Normalizar un proyecto con pantallas

```
/figma-sync normaliza este proyecto:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

**Que hace:** Detecta que es un proyecto (pantallas con sidebar/header) → audita → limpia layers genericos → tokeniza → Auto Layout → reemplaza frames locales por instancias de libreria → valida.

### Auditar sin modificar (solo reporte)

```
/design-normalizer https://www.figma.com/design/XXXXX/mi-archivo?node-id=0-1
```

**Que hace:** Escanea estructura, colores, tipografia, componentes. Genera score 0-100 sin tocar nada.

### Implementar un diseno de Figma en codigo

```
/figma-sync implementa este frame:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=1635-27981
```

**Que hace:** Lee el diseno con `get_design_context` → busca componentes en librerias con `search_design_system` → verifica Code Connect → genera codigo con los componentes reales del proyecto.

### Crear una pantalla nueva en Figma

```
/screen-creator crea la pantalla de Users en:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

**Que hace:** Encuentra una pantalla hermana (la mas parecida) → la clona → actualiza titulo, breadcrumb, contenido → valida con quality gate.

### Sincronizar tokens entre Figma y codigo

```
/token-sync sincroniza los tokens de Figma con el codigo:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

**Que hace:** Lee variables de Figma → lee tokens del codigo (Tailwind, Ant Design, CSS vars) → genera diff → aplica cambios en la direccion elegida.

### Detectar drift (Figma vs produccion)

```
/drift-detection compara Figma con produccion:
Figma: https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
Produccion: https://mi-app.com
```

**Que hace:** Inventaria frames en Figma vs rutas en codigo → compara screenshots → compara tokens → genera reporte priorizado (CRITICAL/HIGH/MEDIUM/LOW).

### Mapear componentes Figma a codigo (Code Connect)

```
/code-connect-bridge mapea los componentes:
https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

**Que hace:** Escanea componentes en Figma → AI sugiere mapeos al codigo → presenta tabla para confirmar → guarda mappings en bulk.

### Capturar la UI del proyecto a Figma (desktop + mobile)

```
/code-to-figma captura desktop y mobile a:
https://www.figma.com/design/XXXXX/mi-proyecto?node-id=0-1
```

**Que hace:** Detecta el framework y lazy load del proyecto → inyecta scripts temporales para forzar contenido visible → hace auto-scroll para activar IntersectionObserver/Framer Motion → captura desktop (1440px) via `open` → captura mobile (375px) via Chrome `--app --window-size=375,812` → renombra frames → limpia scripts temporales y duplicados.

**Viewports soportados:** Desktop (1440px), Mobile (375px), Tablet (768px), Custom (NxM).

**Frameworks soportados:** Next.js, Vite, Vue, Nuxt, Angular, Astro, SvelteKit, plain HTML.

**Lazy load soportado:** Framer Motion, IntersectionObserver, GSAP, ScrollTrigger, AOS, `loading="lazy"`.

### Crear un archivo Figma nuevo

```
/figma-create-new-file design "Mi Proyecto v2"
```

**Que hace:** Resuelve el equipo/organizacion → crea archivo vacio → retorna URL y fileKey para usar en otros skills.

### Generar reglas de design system para el proyecto

```
/design-system-rules-generator
```

**Que hace:** Analiza el codebase + archivo Figma → genera reglas personalizadas → guarda en CLAUDE.md (o AGENTS.md para Codex, .cursor/rules para Cursor).

### Ver la salud del design system

```
/design-system-health https://www.figma.com/design/XXXXX/mi-libreria?node-id=0-1
```

**Que hace:** Combina auditoria (score 0-100) + Code Connect coverage (% mapeado) + Library Analytics (uso de componentes, detachments) → genera dashboard.

### Buscar inteligencia de diseno para un producto

```
/ui-ux-pro-max Build a hotel CMS admin panel with Ant Design
```

**Que hace:** Busca en 5 dominios en paralelo (producto, estilo, color, patron, tipografia) → genera sistema de diseno completo con recomendaciones especificas.

### Definir la identidad de marca

```
/brand Define la identidad de Oasis Hoteles: colores corporativos (#364546 corpo teal),
tipografia Roboto, voz profesional-hospitalaria
```

**Que hace:** Crea `docs/brand-guidelines.md` con paleta, tipografia, voz, reglas de uso → alimenta token-sync y screen-creator.

### Crear banners para redes sociales

```
/banner-design Create Instagram and Facebook banners for summer promotion
```

**Que hace:** Genera banners HTML en multiples dimensiones, usa la identidad de marca, ofrece opciones de art direction.

### Crear presentacion del proyecto

```
/slides Create a 10-slide presentation about the CMS design system health metrics
```

**Que hace:** Genera presentacion HTML con Chart.js, tokens de diseno, copywriting formulas, layouts responsivos.

---

## Todos los Skills (23)

### Inteligencia de Diseno (ui-ux-pro-max)
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/ui-ux-pro-max` | Read | **Buscar** estilo, paleta, tipografia, guidelines UX. 161 reglas, 67 estilos, 99 guidelines |
| `/uipro-design-system` | Read | Arquitectura de tokens 3 capas (primitive→semantic→component), specs de componentes |
| `/ui-styling` | Ref | Referencia shadcn/ui, Tailwind, responsive, dark mode, accesibilidad |

### Marca & Identidad
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/brand` | Write | Identidad de marca: voz, colores, tipografia, visual identity, messaging |
| `/uipro-design` | Write | Router unificado: logos (55 estilos), CIP, iconos, banners, slides, social |
| `/banner-design` | Write | Banners para redes sociales, ads, heroes. 22 estilos, multiples plataformas |
| `/slides` | Write | Presentaciones HTML con Chart.js, design tokens, copywriting formulas |

### Prerequisitos Figma
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/figma-use` | Ref | **OBLIGATORIO** antes de `use_figma`. 17 reglas pre-flight, gotchas, scripts JS helper |

### Normalizacion Figma
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/normalization-pipeline` | Write | Pipeline completo de normalizacion (6 fases) |
| `/design-normalizer` | Read | Auditoria con score 0-100 |

### Creacion Figma
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/screen-creator` | Write | Crear pantallas clonando hermanas, busca en librerias |
| `/component-library-sync` | Write | Organizar componentes en Design System |
| `/variant-generator` | Write | Generar variantes desde props del codigo |
| `/figma-create-new-file` | Write | Crear archivo Figma nuevo (Design o FigJam) |

### Sincronizacion
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/figma-sync` | Both | Orquestador — detecta libreria vs proyecto, rutea al pipeline correcto |
| `/code-to-figma` | Write | Capturar UI a Figma: multi-viewport (desktop+mobile+tablet), lazy load, multi-framework |
| `/token-sync` | Write | Sincronizar tokens. Soporta Extended Collections (Enterprise) |
| `/code-connect-bridge` | Write | Mapear componentes Figma → codigo. Templates parserless avanzados |
| `/design-system-rules-generator` | Write | Generar reglas de DS para CLAUDE.md/AGENTS.md/.cursor/rules |

### Calidad
| Skill | Tipo | Descripcion |
|-------|------|-------------|
| `/drift-detection` | Read | Comparar Figma vs produccion. Library Analytics (Enterprise) |
| `/figma-quality-gate` | Read | Validacion post-creacion. Check Designs linter |
| `/design-system-health` | Read | Dashboard: auditoria + analytics + Code Connect coverage |
| `/ui-framework-patterns` | Ref | Patrones CRUD por framework |

---

## Flujo Completo de Trabajo

El flujo es **top-down para definir** (inteligencia → marca → tokens → pantallas) y **bottom-up para validar** (quality gate → health → drift).

### Fase 1 — Definir Proyecto (una sola vez)
```
/ui-ux-pro-max       → Buscar estilo, paleta, tipografia para el tipo de producto
  ▼
/brand               → Definir identidad de marca (colores, voz, tipografia)
  ▼
/uipro-design-system → Estructurar tokens 3 capas (primitive→semantic→component)
  ▼
/token-sync          → Crear variables en Figma desde los tokens
  ▼
/design-system-rules-generator → Generar reglas para agentes AI
```

### Fase 2 — Normalizar Diseno Existente
```
/normalization-pipeline → Orquestador de 6 fases
  ├── /design-normalizer    → Auditoria (score, inventario)
  ├── Limpieza estructural  → Renombrar layers, organizar paginas
  ├── /token-sync + /brand  → Aplicar variables, validar on-brand
  ├── Auto Layout           → Selectivo, bottom-up
  ├── /component-library-sync + /ui-framework-patterns → Componentizar
  └── /figma-quality-gate + /ui-ux-pro-max → Validacion final
```

### Fase 3 — Crear Pantallas Nuevas
```
/ui-ux-pro-max search    → Patron de UI para el tipo de pantalla
  ▼
/ui-framework-patterns   → Estructura CRUD del framework (Ant Design, shadcn, etc.)
  ▼
/screen-creator          → Clonar pantalla hermana en Figma
  ▼
/variant-generator       → Variantes (empty, loading, error)
  ▼
/figma-quality-gate      → Validar
```

### Fase 4 — Sincronizacion Bidireccional
```
Figma → Codigo:
  /figma-sync → get_design_context → /code-connect-bridge → /ui-styling → codigo

Codigo → Figma:
  /figma-sync → /code-to-figma → generate_figma_design (desktop 1440 + mobile 375)
                                  ├── auto-scroll + lazy load override
                                  ├── Chrome --app para mobile viewport
                                  └── renombrar + limpiar duplicados
```

### Fase 5 — Monitoreo Continuo
```
/design-system-health  → Dashboard: tokens + Code Connect + componentes
/drift-detection       → Figma vs produccion sincronizados?
/slides                → Presentar metricas con Chart.js
```

### Fase 6 — Assets de Marketing (opcional)
```
/uipro-design   → Logo, CIP, iconos
/banner-design  → Banners para redes sociales
/slides         → Presentaciones del proyecto
  └── todos usan /brand → Identidad consistente
```

---

## Busqueda de Inteligencia de Diseno

```bash
# Buscar recomendaciones por dominio
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max>]

# Dominios disponibles:
#   product    — Tipo de producto (SaaS, e-commerce, CMS, dashboard)
#   style      — Estilos UI (glassmorphism, minimalism, brutalism, 67 total)
#   color      — Paletas de color (161 paletas por tipo de producto)
#   typography — Pares tipograficos (57 combinaciones con Google Fonts)
#   landing    — Estructura de landing pages y CTAs
#   chart      — Tipos de graficas y librerias recomendadas
#   ux         — Guidelines y anti-patrones (99 reglas)

# Stacks: html-tailwind, react, nextjs, vue, nuxtjs, svelte, shadcn, flutter, swiftui, react-native

# Ejemplos:
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "hotel CMS" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "hospitality" --domain color
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "admin dashboard" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "data table" --stack react
```

---

## Arquitectura

```
                    ┌─────────────────┐
                    │  ui-ux-pro-max  │ ← Inteligencia de diseno
                    │  (161 reglas)   │
                    └────────┬────────┘
                             │ informa
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌────────┐   ┌───────────┐  ┌──────────┐
         │ brand  │   │ uipro-ds  │  │ui-styling│
         │(marca) │   │ (tokens)  │  │(Tailwind)│
         └───┬────┘   └─────┬─────┘  └────┬─────┘
             │              │              │
             └──────┬───────┘              │
                    ▼                      │
              ┌───────────┐                │
              │ token-sync │ ◄─────────────┘
              │(Figma vars)│
              └─────┬──────┘
                    │ alimenta
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌──────────┐ ┌────────────┐ ┌──────────────┐
│ screen   │ │ component  │ │  variant     │
│ creator  │ │ library    │ │  generator   │
└────┬─────┘ └──────┬─────┘ └──────┬───────┘
     │              │              │
     └──────────────┼──────────────┘
                    ▼
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌──────────┐ ┌────────────┐ ┌──────────────┐
│ quality  │ │   drift    │ │ design-sys   │
│  gate    │ │ detection  │ │   health     │
└──────────┘ └────────────┘ └──────────────┘
                    ▲
                    │
              ┌─────┴──────┐
              │ figma-sync │ ← Orquestador Figma↔Codigo
              └────────────┘

  ┌───────────────────────────────────────────────────────┐
  │  /figma-use (prerequisito para toda escritura)        │
  │  17 reglas + gotchas + 5 scripts JS helper            │
  └───────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────┐
  │  MCP TOOLS (Figma Remote — sin Desktop Bridge)        │
  │                                                       │
  │  WRITE: use_figma, send_code_connect_mappings,       │
  │         create_new_file, generate_figma_design        │
  │                                                       │
  │  READ:  get_metadata, get_screenshot,                │
  │         get_design_context, get_variable_defs,       │
  │         search_design_system, get_code_connect_*     │
  └───────────────────────────────────────────────────────┘
```

---

## Reglas Criticas

- **Tokens ANTES de componentes.** Siempre.
- **Fuente de verdad de colores = el diseno,** NUNCA el codigo.
- **Antes de `use_figma`, cargar `/figma-use`** con las 17 reglas pre-flight.
- **Antes de crear componentes, buscar con `search_design_system`** en librerias publicadas.
- **Antes de crear pantallas, buscar con `/ui-ux-pro-max`** el patron adecuado.
- **Checkpoint visual despues de cada paso.** Si algo se ve mal → Cmd+Z.
- **NUNCA borrar colecciones** sin limpiar bindings. Preferir undo.

## Errores Comunes en Tokenizacion

| Error | Causa | Prevencion |
|-------|-------|------------|
| Colores no coinciden con el diseno | Se usaron colores del codigo | SIEMPRE escanear hex reales del archivo |
| Nodos se ven negros/oscuros | Bindings huerfanas de colecciones borradas | Hacer undo en vez de borrar+recrear |
| Mismo color aplicado donde no debe | Batch-apply por hex sin contexto | Aplicar por CONTEXTO primero, hex fallback |
| Cuadros negros en placeholders | Fills IMAGE no detectados | Buscar todos los fill types, no solo SOLID |
| Texto invisible en botones | Texto y fondo del mismo color | Verificar contraste en variantes hover/active |

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| `use_figma` no disponible | `claude mcp add --transport http figma-remote https://mcp.figma.com/mcp` |
| Escrituras fallan, lecturas ok | Verificar acceso a `use_figma` y que `/figma-use` se cargue antes de scripts complejos |
| Extended Collections falla | Requiere plan Enterprise. Fallback: usar modes (max 4 en Professional) |
| Colores cambiaron al tokenizar | Hex no coincide. Undo y re-escanear colores reales |
| search.py no encuentra resultados | Verificar que `--domain` sea valido: product, style, color, typography, landing, chart, ux |

## Proyectos Compatibles

Funciona con cualquier proyecto frontend:
- React, Next.js, Vue, Nuxt, Svelte, Angular
- Ant Design, Material UI, Tailwind, Shadcn/ui, Chakra, Bootstrap
- CSS custom properties, Style Dictionary, cualquier sistema de tokens
- SwiftUI, React Native, Flutter (via ui-ux-pro-max stacks)

## Documentacion

- `docs/architecture.md` — Flujos de ejecucion completos (MCP tools + skills por cada workflow)
- `docs/how-to-adopt.md` — Guia paso a paso para adoptar en proyectos nuevos
- `docs/decisions/` — ADRs (5 decisiones arquitectonicas documentadas)
