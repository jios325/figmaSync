# Plan 05: Migrar pagina "CMS corpo" al nuevo archivo Figma

## Contexto

**Origen:** [cms-corporativo-2024---Claude](https://www.figma.com/design/6fN8UlkT1fyrWh8rgAjBuw/cms-corporativo-2024---Claude?node-id=1-85) — Pagina "CMS corpo" (node 1:85)
**Destino:** [cms.oasishoteles.com](https://www.figma.com/design/ENjr07ZSZvYoCELJWCHafg/cms.oasishoteles.com?node-id=0-1) — Archivo nuevo, vacio
**Fecha analisis:** 2026-03-18
**Libreria UI:** Ant Design 5 (importar como libreria en destino)

---

## Diagnostico del archivo origen

### Numeros clave

| Metrica | Valor |
|---------|-------|
| Top-level elements en pagina | 129 |
| Pantallas reales (1440px wide) | ~75 |
| Modales | 6 |
| Componentes locales (section) | 1 section con ~71 symbols |
| Elementos huerfanos | ~25 (groups, instances sueltas, frames auxiliares) |
| Symbols/component sets | 4 (mercados div, tabs-promo, bar promos, hoteles tab, opiniones) |
| Total frames internos | 613 |
| Duplicados confirmados | 3 (Bodas general x2, promo SEO x2, secondary button blue x3) |

### Problemas estructurales detectados

1. **Todo en UNA sola pagina** — 129 elementos en un canvas gigante
2. **Sin secciones (Figma Sections)** — Solo 1 section "Componentes Locales", todo lo demas suelto
3. **Elementos huerfanos** — Buttons sueltos, icons FilePdf, Groups sin contexto, markmap
4. **Union boolean vacia** (0x0px) — ID 1614:31849
5. **Nombres genericos** — Frame 151-188, Group 127-981, Container x53
6. **Componentes mezclados con pantallas** — Symbols como "bar promos", "opiniones" al nivel de pantallas
7. **Pantallas de animacion** — 3 frames "cards hoteles dsct - animate 1/2/3" que son states, no pantallas

---

## Inventario completo categorizado

### Categoria 1: Login & Dashboard (3 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 1 | login | 963:12026 | 1440x1024 | ✅ | ✅ |
| 2 | loader login | 1400:127997 | 1440x1200 | ✅ | ✅ |
| 3 | complejos | 1:87 | 1440x1200 | ✅ | ✅ |

### Categoria 2: Hotel Interna — Contenido (6 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 4 | interna/home | 612:2620 | 1440x5238 | ✅ | ✅ |
| 5 | interna/habitaciones | 776:4362 | 1440x1628 | ✅ | ✅ |
| 6 | interna/habitaciones agregar | 633:8166 | 1440x2520 | ✅ | ✅ |
| 7 | interna/CDC | 796:10663 | 1440x1599 | ✅ | ✅ |
| 8 | interna/CDC interna | 796:11028 | 1440x1200 | ✅ | ✅ |
| 9 | interna/entretenimiento | 881:9116 | 1440x1763 | ✅ | ✅ |

### Categoria 3: Hotel Interna — Entretenimiento & Agregar (2 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 10 | interna/entretenimiento agregar | 874:8555 | 1440x1815 | ✅ | ✅ |
| 11 | servicios y amenidades | 639:9599 | 1440x1200 | ❌ | ✅ |

### Categoria 4: Hotel Interna — Multimedia (4 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 12 | interna/multimedia | 904:13331 | 1440x1584 | ✅ | ✅ |
| 13 | interna/multimedia interna | 919:11299 | 1440x1792 | ✅ | ✅ |
| 14 | interna/multimedia video | 1079:15527 | 1440x1950 | ✅ | ✅ |
| 15 | interna/multimedia 360 | 1079:16090 | 1440x1739 | ✅ | ✅ |

### Categoria 5: Hotel Interna — SEO (5 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 16 | interna/home seo | 1055:13310 | 1440x1200 | 🔶 | ✅ |
| 17 | interna/habitaciones seo | 1055:14654 | 1440x1200 | 🔶 | ✅ |
| 18 | interna/CDC seo | 1058:17500 | 1440x1200 | 🔶 | ✅ |
| 19 | interna/entretenimiento seo | 1058:18624 | 1440x1200 | 🔶 | ✅ |
| 20 | interna/multimedia seo | 1058:19679 | 1440x1200 | 🔶 | ✅ |

### Categoria 6: Hotel Interna — Beach Clubs & Sian Ka'an (3 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 21 | interna/beachclubs | 2443:29340 | 1440x1763 | ❌ | ✅ |
| 22 | interna/beachclubs add | 2443:29386 | 1440x1815 | ❌ | ✅ |
| 23 | interna/siankaan | 2405:28477 | 1440x3155 | ❌ | ✅ |

### Categoria 7: CDC Exclusivos (5 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 24 | centros de consumo lista | 804:7441 | 1440x1413 | ✅ | ✅ |
| 25 | agregar Centros de Consumo | 901:11191 | 1440x1435 | ✅ | ✅ |
| 26 | agregar Centros de Consumo Exclusivo | 901:12260 | 1440x4035 | ❌ | ✅ |
| 27 | editar exclusivo | 1044:11716 | 1440x3190 | ❌ | ✅ |
| 28 | agregar Centros de Consumo Exclusivo SEO | 1149:17627 | 1440x1145 | ❌ | ✅ |

### Categoria 8: Restaurantes Exclusivos (2 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 29 | General Restaurantes exlcusivos | 1172:15201 | 1440x1285 | ❌ | ✅ |
| 30 | General Restaurantes exlcusivos seo | 1172:15708 | 1440x1285 | ❌ | ✅ |

### Categoria 9: Servicios (12 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 31 | servicios/lista spa | 1087:14352 | 1440x1306 | ❌ | ✅ |
| 32 | servicios/lista mice | 1099:15163 | 1440x1306 | ❌ | ✅ |
| 33 | servicios/lista foto | 1099:15384 | 1440x1306 | ❌ | ✅ |
| 34 | servicios/lista daypass - seo | 1122:15936 | 1440x1306 | ❌ | ✅ |
| 35 | servicios/lista spa seo | 1144:15868 | 1440x1965 | ❌ | ✅ |
| 36 | servicios/lista mice seo | 1146:16148 | 1440x1200 | ❌ | ✅ |
| 37 | servicios/lista foto seo | 1146:16421 | 1440x1200 | ❌ | ✅ |
| 38 | servicios/crear spa | 1091:15128 | 1440x1306 | ❌ | ✅ |
| 39 | servicios/crear mice | 1091:15999 | 1440x1415 | ❌ | ✅ |
| 40 | servicios/crear foto | 1091:16412 | 1440x1306 | ❌ | ✅ |
| 41 | servicios/crear mice SEO | 1172:14840 | 1440x1116 | ❌ | ✅ |

### Categoria 10: Bodas / Eventos (5 pantallas — 1 duplicada)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 42 | Bodas general | 1172:16134 | 1440x1306 | ❌ | ✅ |
| 43 | ~~Bodas general (2)~~ | 2452:30498 | 1440x1306 | — | ❌ DUPLICADO |
| 44 | Bodas general seo | 1172:16153 | 1440x1200 | ❌ | ✅ |
| 45 | crear bodas item | 1172:16171 | 1440x1427 | ❌ | ✅ |
| 46 | bodas item seo | 1172:16204 | 1440x1116 | ❌ | ✅ |

### Categoria 11: Kiddo (3 pantallas + 1 modal)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 47 | kiddo general | 1183:16948 | 1440x1714 | ❌ | ✅ |
| 48 | kiddo crear card | 1184:19523 | 1440x1399 | ❌ | ✅ |
| 49 | kiddo general SEO | 1183:17857 | 1440x1225 | ❌ | ✅ |
| 50 | modal nuevo kiddo | 1191:17366 | 355x188 | ❌ | ✅ como modal |

### Categoria 12: Mercados (2 pantallas + 1 modal)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 51 | mercados | 1222:17141 | 1440x1285 | ❌ | ✅ |
| 52 | mercado modal | 1226:48199 | 763x416 | ❌ | ✅ como modal |

### Categoria 13: Promociones Internas (7 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 53 | promociones internas lista- ofertas especiales | 1244:145940 | 1440x1479 | ❌ | ✅ |
| 54 | promociones internas agregar editar | 1250:17923 | 1440x2743 | ❌ | ✅ |
| 55 | promociones internas agregar editar SEO | 1347:21767 | 1440x1116 | ❌ | ✅ |
| 56 | promo interna general SEO | 1271:18843 | 1440x1211 | ❌ | ✅ |
| 57 | cards paquetes | 1262:18484 | 1440x1479 | ❌ | ✅ |
| 58 | paquetes cards agregar editar | 1262:18842 | 1440x2440 | ❌ | ✅ |
| 59 | ~~promo interna general SEO (2)~~ | 1339:23473 | 1440x1211 | — | ❌ DUPLICADO |

### Categoria 14: Promociones Externas (4 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 60 | promociones Externas lista- ofertas especiales | 1298:19800 | 1440x1479 | ❌ | ✅ |
| 61 | promociones externas agregar editar | 1308:21356 | 1440x1915 | ❌ | ✅ |
| 62 | promocion inactiva editar | 1337:22873 | 1440x1915 | ❌ | ✅ |
| 63 | dsct hotels | 1347:20848 | 400x690 | ❌ | ✅ como componente |

### Categoria 15: Hotspot (7 pantallas + 2 modales)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 64 | hotspot | 1430:25772 | 1440x1479 | ❌ | ✅ |
| 65 | hotspot servicios o promociones | 1436:78484 | 1440x1479 | ❌ | ✅ |
| 66 | hotspot Formulario | 1436:78002 | 1440x1479 | ❌ | ✅ |
| 67 | hotspot Items Texto | 1443:31462 | 1440x1479 | ❌ | ✅ |
| 68 | hotspot Items Cards | 1475:26899 | 1440x1479 | ❌ | ✅ |
| 69 | items texto interna | 1468:26378 | 1440x1306 | ❌ | ✅ |
| 70 | hotspot Formulario cards | 1475:27462 | 1440x1479 | ❌ | ✅ |
| 71 | modal nuevo hotspot | 1490:26988 | 517x188 | ❌ | ✅ como modal |
| 72 | modal nuevo servicio o promocion | 1436:78456 | 517x188 | ❌ | ✅ como modal |

### Categoria 16: Exact Domains (6 pantallas)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 73 | exact domain / home | 1614:25373 | 1440x2327 | ❌ | ✅ |
| 74 | exact domain / habitaciones | 1618:34832 | 1440x2059 | ❌ | ✅ |
| 75 | exact domain / Servicios | 1618:35403 | 1440x2059 | ❌ | ✅ |
| 76 | exact domain / Centros de Consumo | 1618:35901 | 1440x2059 | ❌ | ✅ |
| 77 | exact domain / Galeria | 1618:36399 | 1440x1510 | ❌ | ✅ |
| 78 | exact domain / Entretenimiento | 1618:37230 | 1440x2059 | ❌ | ✅ |

### Categoria 17: Opiniones (1 pantalla)

| # | Nombre | Node ID | Tamano | En prod | Migrar |
|---|--------|---------|--------|---------|--------|
| 79 | opiniones | 2462:30131 | 1440x1506 | ❌ | ✅ |

### NO MIGRAR — Elementos huerfanos y auxiliares

| Nombre | Node ID | Tipo | Razon |
|--------|---------|------|-------|
| markmap 1 | 2860:33573 | Diagrama | No es pantalla |
| Frame 187 | 3501:30575 | Frame auxiliar | Sin contexto |
| Frame 188 | 3511:31374 | Frame auxiliar | Sin contexto |
| Union | 1614:31849 | Boolean op 0x0 | Vacio |
| secondary button blue | 2524:31659 | Component frame | Va en componentes |
| secondary button blue (inst) | 693:5681 | Instancia suelta | Huerfano |
| secondary button blue (inst) | 2524:31647 | Instancia suelta | Huerfano |
| Upload (inst) | 3514:31838 | Instancia suelta | Huerfano |
| Button (inst) | 1291:19539 | Instancia suelta | Huerfano |
| Alert (inst) | 1271:18839 | Instancia suelta | Huerfano |
| FilePdf x8 | 1961:* | Iconos sueltos | Huerfanos |
| image 2 | 2462:30355 | Rounded rect | Huerfano |
| Group 127 | 949:19111 | Frame auxiliar | Sin contexto |
| Group 168 | 1034:18949 | Frame auxiliar | Sin contexto |
| Group 191 | 3514:31845 | Frame auxiliar | Sin contexto |
| Group 222 | 1261:19468 | Frame auxiliar | Sin contexto |
| Group 954 | 2524:31095 | Frame auxiliar | Sin contexto |
| Group 202 | 5719:31043 | Frame auxiliar | Sin contexto |
| Frame 151-152 | 5719:* | Frames auxiliares | Sin contexto |
| Frame 159-168 | 1261-1262:* | Frames aux (x8) | Snippets de cards |
| Frame 186 | 2524:30830 | Frame auxiliar | Sin contexto |
| foto-drag and drop | 2524:30663 | Prototipo | Mover a componentes |
| pick color | 1251:19363 | Color picker | Mover a componentes |
| mercados div | 1386:35834 | Symbol | Mover a componentes |
| tabs-promo internas | 1283:18953 | Symbol | Mover a componentes |
| bar promos | 1250:18510 | Symbol | Mover a componentes |
| hoteles tab | 1618:37798 | Symbol | Mover a componentes |
| opiniones (symbol) | 2471:30604 | Symbol | Mover a componentes |
| cards hoteles dsct - animate 1 | 1347:27238 | Animacion state | Fusionar con cards hoteles dsct |
| cards hoteles dsct - animate 2 | 1347:24236 | Animacion state | Fusionar con cards hoteles dsct |
| cards hoteles dsct - animate 3 finish | 1375:32098 | Animacion state | Fusionar con cards hoteles dsct |
| cards hoteles dsct | 1320:21799 | Base | Fusionar como variantes |

**Total huerfanos/auxiliares:** ~35 elementos
**Total pantallas reales a migrar:** ~79
**Total modales a migrar:** 5

---

## Estructura propuesta para el archivo nuevo

### Paginas del archivo destino

```
cms.oasishoteles.com (ENjr07ZSZvYoCELJWCHafg)
│
├── 📄 Cover
│   └── Portada del proyecto con links internos
│
├── 📄 Design System
│   ├── [Section] Ant Design Overrides
│   │   └── Solo componentes que EXTIENDEN Ant Design
│   │       (pick color, foto-drag-drop, opiniones card)
│   │
│   ├── [Section] CMS Components
│   │   ├── Navigation: sidebar, menu interno, tabs-promo, hoteles tab, bar promos
│   │   ├── Bars: bar entretenimiento, restaurantes, servicios, amenidades
│   │   ├── Cards: hotel, fotos, dsct hotels
│   │   ├── Forms: habitaciones row, mercados div
│   │   └── Modals: nuevo kiddo, mercado, nuevo hotspot, nuevo servicio, confirmacion
│   │
│   └── [Section] Tokens Reference
│       └── Colores, tipografia, spacing (visual reference)
│
├── 📄 01 — Login & Dashboard
│   ├── login
│   ├── loader login
│   └── complejos (dashboard)
│
├── 📄 02 — Hotel Interna
│   ├── [Section] Contenido
│   │   ├── interna/home
│   │   ├── interna/habitaciones
│   │   ├── interna/habitaciones agregar
│   │   ├── interna/CDC
│   │   ├── interna/CDC interna
│   │   ├── interna/entretenimiento
│   │   └── interna/entretenimiento agregar
│   │
│   ├── [Section] Multimedia
│   │   ├── interna/multimedia
│   │   ├── interna/multimedia interna
│   │   ├── interna/multimedia video
│   │   └── interna/multimedia 360
│   │
│   ├── [Section] SEO
│   │   ├── interna/home seo
│   │   ├── interna/habitaciones seo
│   │   ├── interna/CDC seo
│   │   ├── interna/entretenimiento seo
│   │   └── interna/multimedia seo
│   │
│   └── [Section] Beach Clubs & Sian Ka'an
│       ├── interna/beachclubs
│       ├── interna/beachclubs add
│       └── interna/siankaan
│
├── 📄 03 — CDC & Restaurantes Exclusivos
│   ├── centros de consumo lista
│   ├── agregar Centros de Consumo
│   ├── agregar Centros de Consumo Exclusivo
│   ├── agregar Centros de Consumo Exclusivo SEO
│   ├── editar exclusivo
│   ├── General Restaurantes exclusivos
│   └── General Restaurantes exclusivos seo
│
├── 📄 04 — Servicios
│   ├── [Section] Listas
│   │   ├── servicios y amenidades
│   │   ├── servicios/lista spa
│   │   ├── servicios/lista mice
│   │   ├── servicios/lista foto
│   │   └── servicios/lista daypass - seo
│   │
│   ├── [Section] Crear/Editar
│   │   ├── servicios/crear spa
│   │   ├── servicios/crear mice
│   │   └── servicios/crear foto
│   │
│   └── [Section] SEO
│       ├── servicios/lista spa seo
│       ├── servicios/lista mice seo
│       ├── servicios/lista foto seo
│       └── servicios/crear mice SEO
│
├── 📄 05 — Promociones
│   ├── [Section] Internas
│   │   ├── promociones internas lista
│   │   ├── promociones internas agregar editar
│   │   ├── promociones internas agregar editar SEO
│   │   ├── promo interna general SEO
│   │   ├── cards paquetes
│   │   └── paquetes cards agregar editar
│   │
│   └── [Section] Externas
│       ├── promociones Externas lista
│       ├── promociones externas agregar editar
│       ├── promocion inactiva editar
│       └── dsct hotels (componente de cards)
│
├── 📄 06 — Bodas & Kiddo
│   ├── [Section] Bodas
│   │   ├── Bodas general
│   │   ├── Bodas general seo
│   │   ├── crear bodas item
│   │   └── bodas item seo
│   │
│   └── [Section] Kiddo
│       ├── kiddo general
│       ├── kiddo general SEO
│       ├── kiddo crear card
│       └── [modal] nuevo kiddo
│
├── 📄 07 — Hotspot
│   ├── hotspot (lista)
│   ├── hotspot servicios o promociones
│   ├── hotspot Formulario
│   ├── hotspot Formulario cards
│   ├── hotspot Items Texto
│   ├── hotspot Items Cards
│   ├── items texto interna
│   ├── [modal] nuevo hotspot
│   └── [modal] nuevo servicio o promocion
│
├── 📄 08 — Exact Domains
│   ├── exact domain / home
│   ├── exact domain / habitaciones
│   ├── exact domain / Servicios
│   ├── exact domain / Centros de Consumo
│   ├── exact domain / Galeria
│   └── exact domain / Entretenimiento
│
├── 📄 09 — Mercados & Opiniones
│   ├── mercados
│   ├── [modal] mercado
│   └── opiniones
│
└── 📄 Archive (deprecated)
    └── Pantallas obsoletas o reemplazadas
```

### Reglas de naming para el archivo nuevo

```
PANTALLAS (frames a 1440px):
  PascalCase con prefijo de modulo
  Ejemplos:
    "Login"                         (no "login")
    "Hotel/Home"                    (no "interna/home")
    "Hotel/Rooms"                   (no "interna/habitaciones")
    "Hotel/Rooms/Create"            (no "interna/habitaciones agregar")
    "Hotel/Home/SEO"                (no "interna/home seo")
    "Services/Spa/List"             (no "servicios/lista spa")
    "Promotions/Internal/List"      (no "promociones internas lista")
    "ExactDomain/Home"              (no "exact domain / home")

MODALES (frames < 1440px):
  Prefijo "Modal/" + PascalCase
  Ejemplos:
    "Modal/NewKiddo"                (no "modal nuevo kiddo")
    "Modal/NewHotspot"              (no "modal nuevo hotspot")
    "Modal/Market"                  (no "mercado modal")

COMPONENTES LOCALES:
  PascalCase, agrupados por seccion
  Ejemplos:
    "Bars/Entertainment"            (no "bar entretenimiento")
    "Bars/Restaurants"              (no "bar restaurantes")
    "Cards/Hotel"                   (no "card hotel")
    "Navigation/Sidebar"            (no "side bar")

LAYERS INTERNOS:
  kebab-case semantico
  Ejemplos:
    "content-area"                  (no "Container")
    "room-list"                     (no "Group 45")
    "form-section"                  (no "Frame 126")
```

---

## Fases de ejecucion

### Fase 0: Preparar archivo destino (MANUAL + AUTO)

**Manual (usuario):**
1. Abrir `cms.oasishoteles.com` en Figma Desktop
2. Importar libreria Ant Design 5 (Assets > Team Library)
3. Copiar pagina "CMS corpo" (1:85) del archivo viejo al nuevo

**Automatizado (figma-console-mcp):**
```javascript
// Crear las 11 paginas via figma_execute:
const pages = [
  'Cover', 'Design System',
  '01 — Login & Dashboard', '02 — Hotel Interna',
  '03 — CDC & Restaurantes', '04 — Servicios',
  '05 — Promociones', '06 — Bodas & Kiddo',
  '07 — Hotspot', '08 — Exact Domains',
  '09 — Mercados & Opiniones', 'Archive'
];
for (const name of pages) {
  const page = figma.createPage();
  page.name = name;
}
```

4. Configurar tokens via `figma_setup_design_tokens` (copiar del origen)

### Fase 1: Mover pantallas a sus paginas (AUTOMATIZADO)

**Via `figma_execute`** — Mover cada frame por su node ID a la pagina correcta:

```javascript
// Ejemplo: mover login a pagina "01 — Login & Dashboard"
await figma.loadAllPagesAsync();
const targetPage = figma.root.children.find(p => p.name === '01 — Login & Dashboard');
const loginFrame = figma.getNodeById('963:12026');
if (targetPage && loginFrame) targetPage.appendChild(loginFrame);
```

Ejecutar en batch por categoria (ver inventario arriba):
- Cat 1: Login & Dashboard → 3 frames
- Cat 2-6: Hotel Interna → 20 frames
- Cat 7-8: CDC & Restaurantes → 7 frames
- Cat 9: Servicios → 12 frames
- Cat 10-11: Bodas & Kiddo → 8 frames
- Cat 12: Mercados → 3 frames
- Cat 13-14: Promociones → 11 frames
- Cat 15: Hotspot → 9 frames
- Cat 16: Exact Domains → 6 frames
- Cat 17: Opiniones → 1 frame

### Fase 2: Eliminar basura (AUTOMATIZADO)

**Via `figma_delete_node`** para cada huerfano identificado:
- ~35 elementos: Groups, Frames auxiliares, instancias sueltas, Union vacia, etc.
- Ver tabla "NO MIGRAR" arriba para IDs completos

### Fase 3: Renombrar frames (AUTOMATIZADO)

**Via `figma_rename_node`** aplicando convenciones nuevas:

| Antes | Despues |
|-------|---------|
| login | Login |
| interna/home | Hotel/Home |
| interna/habitaciones | Hotel/Rooms |
| interna/habitaciones agregar | Hotel/Rooms/Create |
| servicios/lista spa | Services/Spa/List |
| modal nuevo kiddo | Modal/NewKiddo |

Ejecutar en batch via `figma_execute` con mapa de renames.

### Fase 4: Normalizar componentes locales (AUTOMATIZADO)

**Via `figma_execute` + `figma_delete_node`:**

1. **Eliminar duplicados de Ant Design** (Switch 48 vars, TimePicker, Upload, buttons, input, etc.)
2. **Renombrar business-specific** segun convenciones
3. **Reorganizar** en la pagina "Design System"

### Fase 5: Validacion (AUTOMATIZADO)

1. `figma_lint_design` en cada pagina
2. `figma_capture_screenshot` de cada pagina para validacion visual
3. `figma_get_file_data` para verificar estructura final
4. Score target: > 80/100 en Design Normalizer audit

---

## Capacidades tecnicas del MCP

### figma-console-mcp (ESCRITURA — Desktop Bridge)

Con figma-console-mcp instalado y conectado, la migracion es **100% automatizable**:

| Operacion | Herramienta | Estado |
|-----------|-------------|--------|
| Crear paginas | `figma_execute` (figma.createPage()) | ✅ Automatizado |
| Mover frames entre paginas | `figma_execute` (page.appendChild()) | ✅ Automatizado |
| Eliminar nodes basura | `figma_delete_node` | ✅ Automatizado |
| Renombrar layers masivamente | `figma_rename_node` / `figma_execute` | ✅ Automatizado |
| Crear variables/tokens | `figma_setup_design_tokens` | ✅ Automatizado |
| Instanciar componentes Ant Design | `figma_instantiate_component` | ✅ Automatizado |
| Lint/audit WCAG | `figma_lint_design` | ✅ Automatizado |
| Crear componentes | `figma_execute` (figma.createComponent()) | ✅ Automatizado |
| Screenshots de validacion | `figma_capture_screenshot` | ✅ Automatizado |
| Resize frames | `figma_resize_node` | ✅ Automatizado |

### Figma Remote MCP (LECTURA — REST API)

| Capacidad | Herramienta |
|-----------|-------------|
| Leer estructura completa | `get_metadata` |
| Ver screenshots de cualquier node | `get_screenshot` |
| Obtener variables/tokens | `get_variable_defs` |
| Generar codigo desde diseno | `get_design_context` |
| Mapear componentes a codigo | `add_code_connect_map` / `get_code_connect_suggestions` |
| Capturar web a Figma | `generate_figma_design` |

### Operaciones que requieren intervencion manual

| Operacion | Razon |
|-----------|-------|
| Copiar frames entre archivos Figma | API de Figma no soporta cross-file copy |
| Importar libreria Ant Design | Requiere UI de Figma (Assets > Team Library) |

### Estrategia: Automatizada con validacion humana

```
1. Usuario copia pagina del archivo viejo al nuevo (UNICA operacion manual)
2. AI crea paginas automaticamente via figma_execute
3. AI mueve frames a sus paginas correspondientes via figma_execute
4. AI elimina basura via figma_delete_node
5. AI renombra todo via figma_rename_node
6. AI valida con figma_capture_screenshot + figma_lint_design
7. Iteracion hasta score > 80/100
```

---

## Metricas de exito

| Metrica | Antes | Objetivo |
|---------|-------|----------|
| Paginas | 1 (todo junto) | 11 organizadas |
| Naming generico | ~53 "Container", ~42 "Group" | 0 |
| Duplicados | 3 confirmados | 0 |
| Elementos huerfanos | ~35 | 0 |
| Componentes duplicando Ant Design | ~15 | 0 |
| Score Design Normalizer | 35/100 | 80/100 |
