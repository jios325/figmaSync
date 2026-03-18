# Workflow: Hotfix en Produccion (Code → Figma)

## Cuando usar

Cuando se hace un cambio directamente en codigo (hotfix, ajuste de Product, bug fix visual)
que no paso por Figma primero.

## El problema

El cambio se hace en codigo pero Figma queda con la version vieja.
Si no se sincroniza, el proximo developer que lea Figma implementara algo incorrecto.

## Pasos

### 1. Hacer el hotfix en codigo

```bash
# Hacer el fix normalmente
git checkout -b hotfix/nombre-del-fix
# ... hacer cambios ...
git commit -m "fix: [descripcion]"
```

### 2. Detectar que cambio

```bash
# En Claude Code:
"Que componentes se modificaron en este branch?"
→ Usa: gitnexus_detect_changes({scope: "compare", base_ref: "main"})
```

### 3. Capturar estado actual → Figma

```bash
# En Claude Code:
"Actualiza Figma con el estado actual de [pagina afectada]"
→ Activa: figma-sync/skill.md (flujo Code→Figma)

Opciones:
a) existingFile → Actualizar frames en el archivo existente
b) clipboard → Copiar y pegar frames actualizados
```

### 4. Documentar el drift

```bash
# En el commit o PR:
"fix: ajuste de [componente]

Figma sync: pendiente/completado
Frames actualizados: [lista]"
```

### 5. Notificar al equipo de diseno

Si el cambio afecta componentes del design system:
- Mencionar en el PR que frames de Figma se actualizaron
- Si no se pudo sincronizar automaticamente, crear tarea para el disenador

## Checklist

- [ ] Hotfix aplicado y testeado
- [ ] Componentes afectados identificados (GitNexus)
- [ ] Estado actual capturado a Figma (generate_figma_design)
- [ ] Documentado en el commit/PR
- [ ] Equipo de diseno notificado (si aplica)
