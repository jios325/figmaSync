# Drift Detection Report

**Proyecto:** {nombre}
**Fecha:** {YYYY-MM-DD}
**Figma:** {URL del archivo}
**Produccion:** {URL de produccion}
**Ejecutado por:** FigmaSync Drift Detection Agent

---

## Score de Sincronizacion: {XX}%

```
████████████████░░░░ {XX}% sincronizado
```

## Resumen Ejecutivo

| Metrica | Valor |
|---|---|
| Total frames auditados | {N} |
| Sincronizados | {N} ({X}%) |
| Drift visual | {N} |
| Drift de tokens | {N} |
| Solo en Figma (no implementados) | {N} |
| Solo en codigo (sin diseno) | {N} |

## Cambios Recientes en Codigo

Ultimos {N} commits analizados con GitNexus:

| Fecha | Commit | Componentes Afectados | Figma Actualizado? |
|---|---|---|---|
| {fecha} | {mensaje} | {componentes} | {Si/No} |

---

## CRITICO — Requiere accion inmediata

### {Numero}. {Nombre del Frame/Pagina}

- **Frame Figma:** {nombre} (node: {nodeId})
- **Ruta codigo:** {ruta} → {componente}
- **Tipo de drift:** {Visual | Estructural | Token}
- **Descripcion:** {que cambio exactamente}
- **Impacto:** {N} paginas afectadas
- **Prioridad:** CRITICO
- **Accion sugerida:**
  - [ ] {Opcion A: actualizar Figma}
  - [ ] {Opcion B: revertir cambio en codigo}
  - [ ] {Opcion C: merge — tomar lo mejor de ambos}

---

## IMPORTANTE — Planificar correccion

### {Numero}. {Nombre}

- **Tipo:** {tipo}
- **Descripcion:** {descripcion}
- **Impacto:** {impacto}
- **Accion:** {accion}

---

## MODERADO — Backlog

### {Numero}. {Nombre}

- **Tipo:** {tipo}
- **Descripcion:** {descripcion}

---

## Tokens Desincronizados

| Categoria | Token | Valor Figma | Valor Codigo | Delta | Prioridad |
|---|---|---|---|---|---|
| Color | {nombre} | {hex} | {hex/class} | {visible/sutil} | {P} |
| Spacing | {nombre} | {Npx} | {Npx} | {Npx diff} | {P} |
| Font | {nombre} | {desc} | {desc} | {diff} | {P} |

---

## Sincronizados (sin drift)

| Frame | Ruta | Ultimo Sync |
|---|---|---|
| {nombre} | {ruta} | {fecha} |

---

## Siguiente Auditoria

- **Programada:** {fecha}
- **Scope sugerido:** {frames de mayor riesgo}

---

*Generado automaticamente por FigmaSync v1.0*
