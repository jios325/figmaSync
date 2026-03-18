# Workflow: Nueva Feature (Figma → Code → Figma)

## Cuando usar

Cuando un disenador crea un nuevo frame/seccion en Figma y el developer necesita implementarlo.

## Pasos

### 1. Recibir diseno

```
Input: URL de Figma con el frame del nuevo diseno
Ejemplo: https://figma.com/design/6fN8UlkT1fyrWh8rgAjBuw/...?node-id=1635-27981
```

### 2. Verificar Code Connect

```bash
# En Claude Code:
"Verifica los mapeos Code Connect para este archivo de Figma: [URL]"
→ Activa: code-connect-bridge/skill.md
```

Si no hay mapeos → configurarlos primero (Plan 04).

### 3. Auditar calidad del diseno

```bash
# En Claude Code:
"Audita la calidad de este frame de Figma: [URL]"
→ Activa: design-normalizer/skill.md
```

Si score < 60 → pedir al disenador que corrija antes de implementar.

### 4. Implementar

```bash
# En Claude Code:
"Implementa este frame de Figma: [URL]"
→ Activa: figma-sync/skill.md (flujo Figma→Code)
```

El agente:
- Lee el diseno con get_design_context
- Busca componentes existentes en el proyecto
- Genera codigo reutilizando lo que existe
- Agrega traducciones i18n
- Valida impacto con GitNexus

### 5. Verificar visualmente

```bash
# En Claude Code:
"Compara mi implementacion con el diseno de Figma"
→ Activa: drift-detection/skill.md (scope: frame especifico)
```

### 6. Actualizar Figma (si hubo ajustes)

```bash
# Si durante la implementacion se hicieron ajustes al diseno:
"Actualiza Figma con la version implementada de [pagina]"
→ Activa: figma-sync/skill.md (flujo Code→Figma)
```

### 7. Commit

```bash
git add .
git commit -m "feat: implement [feature] from Figma design

Figma: [URL]
Code Connect: mapped
Drift: none"
```

## Checklist

- [ ] Code Connect configurado para componentes relevantes
- [ ] Diseno auditado (score >= 60)
- [ ] Codigo generado reutiliza componentes existentes
- [ ] Traducciones i18n agregadas (es + en)
- [ ] Impacto evaluado con GitNexus
- [ ] Verificacion visual aprobada
- [ ] Figma actualizado si hubo ajustes
