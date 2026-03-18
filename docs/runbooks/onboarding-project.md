# Workflow: Onboarding de Proyecto Nuevo

## Cuando usar

Cuando se quiere integrar FigmaSync en un proyecto existente por primera vez.

## Prerequisitos

1. Proyecto con componentes frontend (React, Vue, Svelte, etc.)
2. Archivo de Figma con disenos del proyecto
3. Claude Code configurado en el proyecto
4. Figma Remote MCP configurado

## Verificar Figma Remote MCP

```bash
# Verificar que el MCP remoto esta configurado
claude mcp list | grep figma

# Si no esta, agregarlo:
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

## Pasos

### Paso 1: Copiar Skills al Proyecto

```bash
# Copiar skills de FigmaSync al proyecto
mkdir -p /tu-proyecto/.claude/skills/figma-sync
mkdir -p /tu-proyecto/.claude/skills/design-normalizer
mkdir -p /tu-proyecto/.claude/skills/drift-detection
mkdir -p /tu-proyecto/.claude/skills/code-connect-bridge

cp /path/to/figmaSync/skills/figma-sync/skill.md /tu-proyecto/.claude/skills/figma-sync/
cp /path/to/figmaSync/skills/design-normalizer/skill.md /tu-proyecto/.claude/skills/design-normalizer/
cp /path/to/figmaSync/skills/drift-detection/skill.md /tu-proyecto/.claude/skills/drift-detection/
cp /path/to/figmaSync/skills/code-connect-bridge/skill.md /tu-proyecto/.claude/skills/code-connect-bridge/
```

### Paso 2: Adaptar Skills al Stack

Editar cada skill.md para ajustar:
- `clientLanguages` y `clientFrameworks` segun tu stack
- Rutas de componentes segun tu estructura de proyecto
- Label de Code Connect segun tu framework

Ejemplos:
```
Next.js + React:
  clientLanguages: "typescript,html,css"
  clientFrameworks: "react,nextjs"
  label: "React"

Nuxt + Vue:
  clientLanguages: "typescript,html,css,vue"
  clientFrameworks: "vue,nuxt"
  label: "Vue"

SvelteKit:
  clientLanguages: "typescript,html,css,svelte"
  clientFrameworks: "svelte,sveltekit"
  label: "Svelte"
```

### Paso 3: Generar Design System Rules

```bash
# En Claude Code:
"Genera las reglas de design system para este proyecto con Figma"
```

Esto ejecuta `create_design_system_rules` y genera un archivo .md
con las convenciones del proyecto para que todos los agentes las sigan.

### Paso 4: Auditoria Inicial

```bash
# En Claude Code:
"Audita este archivo de Figma: [URL del archivo principal]"
```

Esto genera el primer reporte de salud del archivo.

### Paso 5: Setup de Code Connect

```bash
# En Claude Code:
"Mapea los componentes de Figma con el codigo"
```

Esto establece los mapeos iniciales entre Figma y codigo.

### Paso 6: Captura Inicial de Produccion

```bash
# En Claude Code:
"Captura el estado actual de produccion y envialo a Figma"
```

Esto crea una baseline en Figma del estado real del proyecto.

### Paso 7: Configurar Drift Detection (Opcional)

Para proyectos que quieran deteccion automatica:

```bash
# En Claude Code (crea scheduled task):
"Configura drift detection semanal para [proyecto]"
```

## Checklist de Onboarding

- [ ] Figma Remote MCP configurado
- [ ] Skills copiados y adaptados al stack
- [ ] Design System Rules generadas
- [ ] Auditoria inicial completada
- [ ] Code Connect configurado (meta: 80% cobertura)
- [ ] Baseline de produccion capturada en Figma
- [ ] GitNexus indexado (si se usa)
- [ ] Equipo capacitado en los workflows

## Tiempo estimado

| Paso | Tiempo |
|---|---|
| Setup MCP + copiar skills | 15 min |
| Adaptar skills al stack | 30 min |
| Design System Rules | 10 min |
| Auditoria inicial | 20-40 min |
| Code Connect setup | 30-60 min |
| Captura baseline | 15-30 min |
| **Total** | **2-3 horas** |
