# Workflow: Auditoria de Diseno

## Cuando usar

- Al inicio de un proyecto nuevo (onboarding)
- Periodicamente (mensual o trimestral)
- Antes de un rediseno o refactor grande
- Cuando se nota que el codigo generado desde Figma no es bueno

## Pasos

### 1. Auditoria del archivo Figma

```bash
# En Claude Code:
"Audita este archivo de Figma: [URL]"
→ Activa: design-normalizer/skill.md
```

Genera reporte con:
- Score de salud (0-100)
- Issues criticos, importantes, y nice-to-have
- Mapa de tokens (Figma vs Tailwind)

### 2. Setup de Code Connect

```bash
# En Claude Code:
"Mapea todos los componentes de Figma con el codigo: [URL]"
→ Activa: code-connect-bridge/skill.md
```

Genera tabla de mapeos y calcula cobertura.
Meta: 80%+ de componentes mapeados.

### 3. Generar Design System Rules

```bash
# En Claude Code:
"Genera las reglas de design system para este proyecto"
→ Usa: create_design_system_rules
```

Guardar en CLAUDE.md o archivo equivalente del agente.

### 4. Deteccion de Drift Completa

```bash
# En Claude Code:
"Compara todos los frames de Figma con produccion"
→ Activa: drift-detection/skill.md (scope: todo el archivo)
```

### 5. Generar Plan de Accion

Con los 4 reportes anteriores, priorizar:

```
URGENTE (bloquea trabajo):
- [ ] Corregir mapeos Code Connect rotos
- [ ] Actualizar frames con drift critico

IMPORTANTE (mejora calidad):
- [ ] Normalizar naming de layers
- [ ] Crear variables para colores hardcodeados
- [ ] Agregar variantes faltantes

NICE TO HAVE (mejora continua):
- [ ] Agregar Auto Layout a frames legacy
- [ ] Documentar design decisions
- [ ] Crear guia de contribucion para disenadores
```

## Frecuencia recomendada

| Trigger | Frecuencia | Scope |
|---|---|---|
| Proyecto nuevo | Una vez | Todo el archivo |
| Mantenimiento | Mensual | Top 10 paginas |
| Pre-release | Cada release | Paginas afectadas |
| Post-sprint | Cada 2 semanas | Frames del sprint |
