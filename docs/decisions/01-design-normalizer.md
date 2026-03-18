# Plan 01: Design System Normalizer Agent

## Objetivo

Crear un agente que audite cualquier archivo de Figma y genere:
1. Un **reporte de salud** del archivo (score 0-100)
2. Una lista de **issues priorizados** con acciones correctivas
3. **Reglas de design system** formales para el proyecto
4. Un **mapa de tokens** comparando Figma vs codigo (Tailwind config)

## Problema que resuelve

Los archivos de Figma se crean organicamente — multiples disenadores, sin convenciones claras,
componentes duplicados, colores hardcodeados, artboards sin Auto Layout. Esto causa:
- AI genera codigo inconsistente porque lee disenos inconsistentes
- Code Connect no puede mapear componentes si no estan bien definidos
- Drift entre diseno y codigo porque no hay fuente de verdad clara

## Prerequisitos

- Figma Remote MCP configurado (`mcp.figma.com`)
- Acceso al archivo de Figma (view o edit)
- Opcional: `tailwind.config.ts` del proyecto para comparar tokens

## Fases de Implementacion

### Fase 1: Auditoria Estructural

**Input:** URL de Figma (fileKey + nodeId)
**Herramientas:** `get_metadata`, `get_variable_defs`

**Checks:**
```
1. ESTRUCTURA DE PAGES
   - [ ] Cada page tiene un nombre descriptivo (no "Page 1")
   - [ ] Pages organizadas por flujo o feature
   - [ ] Existe una page "Components" o "Design System"

2. NAMING DE LAYERS
   - [ ] Frames principales en PascalCase o kebab-case consistente
   - [ ] No hay layers "Frame 123", "Group 45", "Rectangle 67"
   - [ ] Profundidad maxima de anidacion: 6 niveles
   - [ ] Slots y variantes nombrados semanticamente

3. ORGANIZACION DE ARTBOARDS
   - [ ] Artboards agrupados por seccion/feature
   - [ ] Tamanos consistentes (desktop: 1440px, mobile: 375px)
   - [ ] Spacing entre artboards uniforme
   - [ ] No hay artboards huerfanos o desconectados
```

### Fase 2: Auditoria de Tokens

**Input:** Variables de Figma + tailwind.config.ts
**Herramientas:** `get_variable_defs`, lectura de tailwind.config

**Checks:**
```
4. VARIABLES Y TOKENS
   - [ ] Colores definidos como variables (no hex hardcodeados)
   - [ ] Variables organizadas en jerarquia:
         Primitives → Semantic → Component-level
   - [ ] Spacing basado en escala consistente (4px, 8px, 12px, 16px...)
   - [ ] Typography con ramp definido (size, weight, line-height)

5. CORRESPONDENCIA FIGMA ↔ TAILWIND
   - [ ] Cada color de Figma tiene equivalente en Tailwind config
   - [ ] Font families coinciden
   - [ ] Spacing scale coincide
   - [ ] Border radius coincide
   - [ ] Breakpoints responsive coinciden
```

### Fase 3: Auditoria de Componentes

**Input:** Componentes del archivo
**Herramientas:** `get_design_context`, `get_metadata`

**Checks:**
```
6. COMPONENTES
   - [ ] Componentes son reutilizables (no frames unicos)
   - [ ] Variantes cubren estados: default, hover, active, disabled, loading
   - [ ] Variantes cubren responsive: desktop, tablet, mobile
   - [ ] Auto Layout aplicado (no posicionamiento absoluto)
   - [ ] Constraints correctos para responsive
   - [ ] No hay componentes duplicados o casi-duplicados

7. AUTO LAYOUT
   - [ ] Direction, gap, padding definidos
   - [ ] Fill container vs hug contents correcto
   - [ ] Mapeable a Flexbox/Grid de CSS
```

### Fase 4: Generacion de Reglas

**Input:** Resultados de auditorias
**Herramientas:** `create_design_system_rules`

**Output:**
```
8. DESIGN SYSTEM RULES
   - Archivo .md con reglas formales
   - Mapping de tokens Figma → Tailwind classes
   - Naming conventions para layers
   - Estructura requerida para nuevos componentes
   - Checklist para nuevos artboards
```

## Formato del Reporte

```markdown
# Design System Audit Report
**Archivo:** [nombre] ([URL])
**Fecha:** YYYY-MM-DD
**Score:** XX/100

## Resumen
- Estructura: X/25
- Tokens: X/25
- Componentes: X/25
- Auto Layout: X/25

## Issues Criticos (bloquean Code Connect)
1. [CRITICAL] 15 colores hardcodeados sin variable
2. [CRITICAL] Componente "Card" duplicado 3 veces

## Issues Importantes (degradan calidad de codigo generado)
3. [IMPORTANT] 23 layers con nombre generico
4. [IMPORTANT] 8 frames sin Auto Layout

## Recomendaciones
5. [NICE] Agregar variante "loading" a Button
6. [NICE] Crear page dedicada "Design System"

## Mapa de Tokens
| Figma Variable | Valor | Tailwind Equiv. | Estado |
|---|---|---|---|
| color/primary | #1E40AF | blue-700 | OK |
| color/accent | #F59E0B | amber-500 | OK |
| spacing/sm | 8px | - | FALTA en Tailwind |
```

## Metricas de Score

| Categoria | Peso | Criterios |
|---|---|---|
| Estructura | 25% | Naming, organizacion de pages, profundidad |
| Tokens | 25% | Variables definidas, jerarquia, correspondencia con codigo |
| Componentes | 25% | Reutilizables, variantes, no duplicados |
| Auto Layout | 25% | Aplicado consistentemente, mapeado a Flexbox |

## Edge Cases

- Archivo sin variables definidas → Score de tokens = 0, reporte de urgencia
- Archivo con solo 1 page → No penalizar por organizacion de pages
- Archivo de landing page (no app) → Ajustar criterios de componentes
- Archivo con plugins/widgets → Ignorar layers generados por plugins
- Archivo muy grande (100+ frames) → Auditar por sampling (cada 3er frame)
