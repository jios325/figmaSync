# Auditoría: Material Hardcodeado en Figma

Archivo: `cms.oasishoteles.com` (kzpqeukz3hDKnS8s85yy3K)
Fecha: 2026-03-18
Actualizado: 2026-03-18 (post-limpieza)

## Resumen

- **Score de reutilizacion**: 73/100
- **Instancias reutilizables**: 828 (73%)
- **Material raw restante**: 305 (27%)
- **Nodos basura eliminados**: 72 (60 Resizers + 12 Vectors)

## Por pagina (post-limpieza)

| Pagina | Hijos directos | Instancias | Raw | % Reuso |
|---|---|---|---|---|
| 01 — Login & Dashboard | 68 | 49 | 19 | 72% |
| 02 — Hotel Interna | 286 | 190 | 96 | 66% |
| 03 — CDC & Restaurantes | 63 | 37 | 26 | 59% |
| 04 — Servicios | 134 | 113 | 21 | **84%** |
| 05 — Promociones | 205 | 154 | 51 | 75% |
| 06 — Bodas & Kiddo | 124 | 102 | 22 | **82%** |
| 07 — Hotspot | 109 | 72 | 37 | 66% |
| 08 — Exact Domains | 109 | 89 | 20 | **82%** |
| 09 — Mercados & Opiniones | 35 | 22 | 13 | 63% |
| **TOTAL** | **1,133** | **828** | **305** | **73%** |

## Que esta bien

- Sidebar (`side bar` component): instanciada en TODAS las pantallas
- Header bar (`base bar` component): instanciada en TODAS las pantallas
- Menu interno (`menu interno` component): instanciado correctamente
- Divisores (`divisor` component): instanciados correctamente
- Breadcrumbs (Frame 101): son hijos INTERNOS de instancias, no hardcodeados
- Tab navigation (Frame 97): son hijos INTERNOS de instancias, no hardcodeados

## Material raw restante (305 nodos, 27%)

### Legitimo (no requiere accion)

| Tipo | Cantidad aprox | Ejemplo | Nota |
|---|---|---|---|
| Textos de headers de tabla | ~30 | "Nombre", "Acciones", "Mercado" | Headers estaticos, OK |
| Rectangles de fondo | ~10 | backgrounds de secciones | Decorativos, OK |
| Groups de formularios | ~40 | Group 975, Group 134 | Contenido de forms, legitimo |

### Mejorable (fase futura)

| Tipo | Cantidad aprox | Mejora posible | Prioridad |
|---|---|---|---|
| Groups de formularios complejos | ~40 | Convertir a frames con Auto Layout | MEDIA |
| Frames de tablas (Frame 174/175) | ~10 | Crear componente Table local | MEDIA |
| Groups de busqueda (Group 28) | ~8 | Crear componente SearchBar local | BAJA |
| Frames genericos (Frame 127, 155, 156) | ~15 | Evaluar si deben ser componentes | BAJA |

## Limpieza realizada

| Accion | Cantidad | Paginas afectadas |
|---|---|---|
| Resizers fantasma eliminados | 60 | Hotel Interna (34), Servicios (14), CDC (6), Bodas (4), Mercados (2) |
| Vectors divisores eliminados | 12 | Exact Domains (12) |
| **Total nodos eliminados** | **72** | |

## Correccion de auditoria inicial

La primera auditoria reporto 44% de reutilizacion contando TODOS los nodos recursivamente (incluyendo hijos internos de componentes). El conteo correcto mide solo hijos directos de pantallas:

| Metrica | Auditoria inicial | Auditoria corregida |
|---|---|---|
| Score | 44/100 | **73/100** |
| Sidebar | "hardcodeada" | Ya era instancia |
| Header bar | "hardcodeada" | Ya era instancia |
| Frame 97 (botones) | "247 hardcodeados" | Son internos de instancias |
| Frame 101 (breadcrumbs) | "147 hardcodeados" | Son internos de instancias |
