# Mapeo Base de Datos ↔ Figma

Base de datos: `corpo2026` (64 tablas)
Figma: `cms.oasishoteles.com` (12 paginas, ~79 pantallas)
Fecha: 2026-03-18

## Resumen

| Pagina Figma | Tablas principales | Pantallas | Registros aprox |
|---|---|---|---|
| 01 — Login & Dashboard | users, roles, permissions, hotels | 6 | 110 |
| 02 — Hotel Interna | hotels, rooms, consumption_centers, entertainment, amenities, images, seo | 20 | 2,800+ |
| 03 — CDC & Restaurantes | consumption_centers, consumption_center_landings, consumption_center_prizes | 7 | 301 |
| 04 — Servicios | services, service_categories, spas, massages | 11 | 134 |
| 05 — Promociones | ecommerce_offers, ecommerce_offers_hotels, ecommerce_categories | 10 | 215 |
| 06 — Bodas & Kiddo | service_categories (bodas), hotel_kiddo | 8 | 16 |
| 07 — Hotspot | events, event_tickets, category_events | 9 | 24 |
| 08 — Exact Domains | hotels.exact_domain_url + reutiliza rooms, services, CDC, gallery, entertainment | 6 | (compartidos) |
| 09 — Mercados & Opiniones | markets, reviews | 3 | 550 |
| Design System | Componentes locales | 10 componentes | — |
| Archive | Duplicados, animaciones | 5 | — |
| Cover | — | 0 | — |

---

## Detalle por pagina

### 01 — Login & Dashboard

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `users` | 3 | login, complejos | name, email |
| `roles` | 3 | modal nuevo usuario | admin, editor, viewer |
| `permissions` | 95 | (sin UI dedicada) | CRUD por modulo |
| `hotels` | 9 | complejos (lista) | name, uri, status, hex_color, order |
| `properties` | 4 | — | — |
| `hotel_categories` | 3 | — | — |

### 02 — Hotel Interna

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `hotels` | 9 | interna/home | name, uri, description_es/en, status, is_siankaan, is_only_adults |
| `rooms` | 25 | interna/habitaciones | hotel_id, FK category_rooms |
| `room_amenity` | 331 | interna/habitaciones agregar | pivot rooms ↔ amenities |
| `category_rooms` | 25 | interna/habitaciones | categorias de habitacion |
| `consumption_centers` | 89 | interna/CDC | name, type (restaurant/bar) |
| `consumption_center_hotels` | 171 | interna/CDC interna | pivot CDC ↔ hotels |
| `entertainment` | 12 | interna/entretenimiento | name (Atrium, Kinky, Oasis Arena, etc.) |
| `hotel_entertainment` | 18 | interna/entretenimiento agregar | pivot hotels ↔ entertainment |
| `amenities` | 172 | servicios y amenidades | name_es, type (hotel/room) |
| `hotel_amenity` | 158 | servicios y amenidades | pivot hotels ↔ amenities |
| `images` | 797 | interna/multimedia | path, alt_text |
| `imageables` | 819 | interna/multimedia interna | polymorphic (hotel, room, CDC, etc.) |
| `gallery_categories` | 22 | multimedia interna | General, Reservaciones, A&B, etc. |
| `seo` | 147 | 5 pantallas SEO | title, description, keywords (per section) |
| `hotel_section_descriptions` | 162 | SEO | descriptions per hotel section |
| `hotel_sections` | 14 | — | home, habitaciones, CDC, entretenimiento, etc. |
| `beach_clubs` | 10 | interna/beachclubs | name_es/en |
| `beach_club_hotel` | 18 | interna/beachclubs add | pivot |
| `hotels.is_siankaan` | flag | interna/siankaan | boolean field |

### 03 — CDC & Restaurantes

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `consumption_centers` | 89 | centros de consumo lista | name, type (restaurant/bar) |
| `consumption_center_landings` | 7 | agregar CDC Exclusivo | landing pages para exclusivos |
| `consumption_center_prizes` | 34 | editar exclusivo | premios/reconocimientos |
| `seo` (filtrado por CDC) | — | CDC Exclusivo SEO | title, description, keywords |

### 04 — Servicios

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `services` | 51 | lista spa/mice/foto/daypass | name_es/en, slug, service_category_id |
| `service_categories` | 12 | crear spa/mice/foto | name (JSON: {es, en}), description (JSON) |
| `service_type_categories` | 6 | — | agrupador de service_categories |
| `spas` | 2 | lista spa | name_es |
| `massages` | 13 | crear spa | — |
| `massages_spas` | 6 | crear spa | pivot |
| `services_markets` | 51 | — | pivot services ↔ markets |

### 05 — Promociones

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `ecommerce_offers` | 19 | promos internas lista | title (JSON), starts_from, end_to, market_id |
| `ecommerce_offers_hotels` | 132 | cards hoteles dsct | pivot offers ↔ hotels |
| `ecommerce_categories` | 17 | agregar/editar promo | name_es, slug |
| `ecommerce_categories_faqs` | 47 | — | FAQs por categoria |

### 06 — Bodas & Kiddo

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `service_categories` (id=7) | paquetes bodas | Bodas general, crear item | name (JSON), description (JSON) |
| `hotel_kiddo` | 4 | kiddo general, crear card | hotel_id, schedule, description_es/en (HTML) |
| `hotel_kiddo_activities` | 0 (vacia) | — | feature planeada no implementada |
| `hotel_kiddo_locations` | 0 (vacia) | — | feature planeada no implementada |

### 07 — Hotspot

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `events` | 19 | hotspot lista | — |
| `event_tickets` | 0 (vacia) | hotspot Items Cards | feature planeada |
| `category_events` | 5 | hotspot servicios/promos | — |
| `past_events` | 0 (vacia) | — | feature planeada |

### 08 — Exact Domains

| Tabla | Registros | Pantalla Figma | Notas |
|---|---|---|---|
| `hotels.exact_domain_url` | campo varchar | exact domain / home | URL del dominio exacto |
| Reutiliza `rooms` | 25 | exact domain / habitaciones | mismo data, layout diferente |
| Reutiliza `services` | 51 | exact domain / Servicios | — |
| Reutiliza `consumption_centers` | 89 | exact domain / CDC | — |
| Reutiliza `gallery_categories` + `images` | 22 + 797 | exact domain / Galeria | — |
| Reutiliza `entertainment` | 12 | exact domain / Entretenimiento | — |

### 09 — Mercados & Opiniones

| Tabla | Registros | Pantalla Figma | Campos clave |
|---|---|---|---|
| `markets` | 6 | mercados | Global, USA, Mexico, Colombia, Brazil, LATAM |
| `reviews` | 544 | opiniones | — |

---

## Tablas sin pantalla en Figma

| Tabla | Registros | Prioridad | Nota |
|---|---|---|---|
| `certifications` + `certification_hotel` | 11 + 72 | ALTA | Se gestionan pero no hay CRUD UI |
| `hotel_social_media` + `social_media` | 48 + 6 | ALTA | No hay pantalla de gestion |
| `hotel_locations` + `hotel_location_details` | 6 + 9 | MEDIA | Datos de ubicacion (Cancun/Riviera) |
| `locations` | 2 | BAJA | Probablemente Cancun y Riviera Maya |
| `faqs` | 155 | MEDIA | Se usan inline pero no hay CRUD dedicado |
| `upgrades` | 2 | BAJA | — |
| `personal_access_tokens` | 29 | NINGUNA | Sistema interno Laravel |
| `migrations` | 75 | NINGUNA | Laravel internal |
| `failed_jobs` | 0 | NINGUNA | Laravel queue |
| `password_resets` | 0 | NINGUNA | Laravel auth |
| `model_has_permissions` | 0 | NINGUNA | Spatie permissions |
| `model_has_roles` | 6 | NINGUNA | Spatie permissions |
| `role_has_permissions` | 100 | NINGUNA | Spatie permissions |

---

## Hoteles registrados

| ID | Nombre | URI | Status |
|---|---|---|---|
| 1 | The Pyramid Cancun | the-pyramid-at-grand-oasis | OPEN |
| 2 | The Grand Oasis Cancun | grand-oasis-cancun | OPEN |
| 3 | Grand Oasis Palm | grand-oasis-palm | OPEN |
| 4 | Oasis Palm | oasis-palm | OPEN |
| 5 | Smart Cancun Centro | smart-cancun-by-oasis | OPEN |
| 6 | Oh! Cancun The Urban Oasis & Beach Club | oh-cancun | OPEN |
| 7 | The Sens Cancun | the-sens-cancun | OPEN |
| 8 | Grand Oasis Riviera | grand-oasis-tulum | OPEN |
| 9 | The Sens Riviera | the-sens-tulum-riviera | OPEN |

## Roles y permisos

- **administrator**: acceso total (95 permisos)
- **editor**: CRUD de contenido
- **viewer**: solo lectura

## Campos bilingues (JSON {es, en})

Tablas con campos JSON bilingues que requieren inputs duales en el CMS:
- `service_categories.name` / `service_categories.description`
- `ecommerce_offers.title` / `ecommerce_offers.description` / `ecommerce_offers.slogan` / `ecommerce_offers.phrase` / `ecommerce_offers.benefits` / `ecommerce_offers.terms_and_conditions`
- `hotels.description_es` / `hotels.description_en` (campos separados, no JSON)
- `services.name_es` / `services.name_en` (campos separados)
- `hotel_kiddo.description_es` / `hotel_kiddo.description_en` (campos separados, contiene HTML)

## Tablas vacias (features planeadas)

| Tabla | Relacion | Estado |
|---|---|---|
| `event_tickets` | events | Sin implementar |
| `hotel_kiddo_activities` | hotel_kiddo | Sin implementar |
| `hotel_kiddo_locations` | hotel_kiddo | Sin implementar |
| `past_events` | events | Sin implementar |
| `tickets` | — | Sin implementar |
