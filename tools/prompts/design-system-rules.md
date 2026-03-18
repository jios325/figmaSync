# Design System Rules — {Nombre del Proyecto}

> Este archivo es generado por FigmaSync y refinado manualmente.
> Se usa como contexto para que los agentes AI generen codigo consistente.
> Guardar en CLAUDE.md del proyecto o como skill independiente.

## Archivo Figma de Referencia

- **URL:** {URL del archivo Figma}
- **fileKey:** {fileKey}
- **Ultima auditoria:** {fecha}
- **Score de salud:** {XX}/100

## Tokens

### Colores

| Nombre Semantico | Variable Figma | Valor | Tailwind Class |
|---|---|---|---|
| Primary | color/primary | {hex} | {class} |
| Secondary | color/secondary | {hex} | {class} |
| Background | color/bg/default | {hex} | {class} |
| Text Primary | color/text/primary | {hex} | {class} |
| Text Secondary | color/text/secondary | {hex} | {class} |
| Error | color/error | {hex} | {class} |
| Success | color/success | {hex} | {class} |
| Warning | color/warning | {hex} | {class} |

### Tipografia

| Nivel | Font | Size | Weight | Line Height | Tailwind |
|---|---|---|---|---|---|
| H1 | {font} | {size}px | {weight} | {lh} | {class} |
| H2 | {font} | {size}px | {weight} | {lh} | {class} |
| H3 | {font} | {size}px | {weight} | {lh} | {class} |
| Body | {font} | {size}px | {weight} | {lh} | {class} |
| Caption | {font} | {size}px | {weight} | {lh} | {class} |

### Spacing

| Token | Valor | Tailwind |
|---|---|---|
| xs | {N}px | {class} |
| sm | {N}px | {class} |
| md | {N}px | {class} |
| lg | {N}px | {class} |
| xl | {N}px | {class} |
| 2xl | {N}px | {class} |

### Border Radius

| Token | Valor | Tailwind |
|---|---|---|
| sm | {N}px | {class} |
| md | {N}px | {class} |
| lg | {N}px | {class} |
| full | 9999px | rounded-full |

## Componentes Mapeados (Code Connect)

| Figma Component | Codigo | Props Principales |
|---|---|---|
| {nombre} | {ruta/archivo.tsx} | {props} |

## Reglas de Implementacion

### Al generar codigo desde Figma:

1. **NUNCA hardcodear colores** — usar las clases de Tailwind mapeadas arriba
2. **REUTILIZAR componentes existentes** — revisar Code Connect antes de crear nuevos
3. **Agregar traducciones i18n** — strings visibles en ambos locales (es/en)
4. **Seguir estructura del proyecto** — componentes en {ruta}
5. **Usar path aliases** — {aliases configurados}
6. **Imagenes con {framework de imagenes}** — formatos: {formatos soportados}

### Al actualizar Figma desde codigo:

1. Usar `generate_figma_design` con `outputMode: "existingFile"`
2. Enviar al fileKey del archivo principal
3. Documentar que paginas se actualizaron
4. Notificar al equipo de diseno

### Naming Conventions

| Tipo | Convencion | Ejemplo |
|---|---|---|
| Componentes | {convencion} | {ejemplo} |
| Carpetas | {convencion} | {ejemplo} |
| Hooks | {convencion} | {ejemplo} |
| Types | {convencion} | {ejemplo} |
| Archivos CSS | {convencion} | {ejemplo} |
