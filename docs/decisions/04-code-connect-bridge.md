# Plan 04: Code Connect Bridge

## Objetivo

Establecer y mantener el mapeo automatico entre componentes de Figma y componentes de codigo,
usando Code Connect como puente persistente. Este es el **fundamento** que hace funcionar
todo el sistema — sin Code Connect, el AI adivina; con Code Connect, usa tus componentes reales.

## Problema que resuelve

Sin Code Connect:
```
get_design_context retorna:
  <div className="flex gap-4 p-6 bg-white rounded-lg shadow">
    <img src="..." className="w-64 h-48 object-cover rounded" />
    <div>
      <h3 className="text-xl font-bold">Hotel Name</h3>
      ...
    </div>
  </div>
→ Codigo generico que NO usa tus componentes
```

Con Code Connect:
```
get_design_context retorna:
  <HotelCard
    hotel={hotel}
    variant="horizontal"
    showRating={true}
  />
→ Usa TU componente real con SUS props
```

## Prerequisitos

- Figma Remote MCP
- GitNexus indexado
- Componentes reutilizables en Figma (no frames unicos)
- Componentes React/Vue existentes en el proyecto

## Metodos de Code Connect

Figma ofrece 2 formas de conectar codigo a diseno:

### Code Connect UI (visual, sin codigo)
- Se configura desde Figma Dev Mode
- Language-agnostic
- Ideal para equipos no-tecnicos
- Mapeo simple: nodo → archivo de codigo

### Code Connect CLI (programatico)
- Archivos `.figma.tsx` en el repositorio
- Control total sobre templates y props
- Soporte para variantes y logica condicional
- Ideal para design systems maduros

### Code Connect via MCP (lo que usamos)
- `get_code_connect_suggestions` → auto-deteccion
- `add_code_connect_map` → mapeo individual
- `send_code_connect_mappings` → mapeo bulk
- No requiere archivos adicionales en el repo

## Flujo de Setup Inicial

```
PASO 1: ESCANEAR ARCHIVO FIGMA
  Tool: get_metadata(nodeId: "0:1", fileKey)
  Filtrar: solo nodos que son componentes (reusables)
  Resultado: Lista de componentes Figma con sus nodeIds

  Ejemplo:
  | Figma Component | nodeId | Variantes |
  |---|---|---|
  | Button | 234:567 | Primary, Secondary, Ghost |
  | HotelCard | 345:678 | Horizontal, Vertical |
  | NavItem | 456:789 | Active, Inactive |
  | Hero | 567:890 | Hotel, Landing |

PASO 2: AUTO-DETECTAR MAPEOS
  Tool: get_code_connect_suggestions(nodeId: "234:567", fileKey)
  Para cada componente de Figma, Figma sugiere posibles mapeos

  Ejemplo resultado:
  {
    "suggestions": [
      {
        "nodeId": "234:567",
        "componentName": "Button",
        "suggestedSource": "src/components/ui/Button/index.tsx",
        "confidence": "high"
      }
    ]
  }

PASO 3: COMPLEMENTAR CON GITNEXUS
  Para componentes sin sugerencia o con baja confianza:
  Tool: gitnexus_query("Button component")
  → Busca en el knowledge graph del proyecto

  Tool: gitnexus_context("HotelCard")
  → Ve donde esta definido, quien lo importa, que props acepta

PASO 4: PRESENTAR TABLA AL USUARIO
  | Figma Component | Codigo Sugerido | Confianza | Accion |
  |---|---|---|---|
  | Button | src/components/ui/Button/index.tsx | Alta | Confirmar |
  | HotelCard | src/components/ui/card/HotelCard.tsx | Alta | Confirmar |
  | NavItem | src/components/layout/Navigation/NavItem.tsx | Media | Verificar |
  | Hero | No encontrado | - | Crear o ignorar |
  | Gallery | src/components/ui/GalleryCollage.tsx | Baja | Verificar |

PASO 5: USUARIO CONFIRMA/AJUSTA

PASO 6: GUARDAR MAPEOS
  Tool: send_code_connect_mappings({
    nodeId: "234:567",
    fileKey: "...",
    mappings: [
      {
        nodeId: "234:567",
        componentName: "Button",
        source: "src/components/ui/Button/index.tsx",
        label: "React"
      },
      {
        nodeId: "345:678",
        componentName: "HotelCard",
        source: "src/components/ui/card/HotelCard.tsx",
        label: "React"
      }
    ]
  })

PASO 7: VERIFICAR
  Tool: get_code_connect_map(nodeId: "234:567", fileKey)
  Confirmar que los mapeos se guardaron correctamente
```

## Mantenimiento Continuo

### Cuando agregar nuevos mapeos

| Evento | Accion |
|---|---|
| Nuevo componente en Figma | Buscar equivalente en codigo, mapear |
| Nuevo componente en codigo | Buscar frame en Figma, mapear |
| Componente renombrado | Actualizar mapeo existente |
| Componente eliminado | Remover mapeo |
| Componente movido de archivo | Actualizar source path |

### Deteccion automatica de mapeos rotos

```
PASO 1: Obtener todos los mapeos actuales
  Tool: get_code_connect_map para cada componente conocido

PASO 2: Verificar que los archivos source existen
  Para cada mapeo, verificar que el archivo .tsx/.vue existe en el repo

PASO 3: Verificar que los componentes Figma existen
  get_metadata para verificar que los nodeIds siguen siendo validos

PASO 4: Reportar mapeos rotos
  | Mapeo | Issue |
  |---|---|
  | Button → src/components/ui/Button.tsx | Archivo movido a Button/index.tsx |
  | OldCard → 234:567 | Nodo eliminado en Figma |
```

## Mapeo Avanzado: Templates con Props

Para componentes con variantes, se puede crear un template mas detallado:

```javascript
// Template para Code Connect
{
  nodeId: "234:567",
  componentName: "Button",
  source: "src/components/ui/Button/index.tsx",
  label: "React",
  template: `
    import { Button } from '@/components/ui/Button';
    <Button
      variant={figma.enum("Variant", {
        "Primary": "primary",
        "Secondary": "secondary",
        "Ghost": "ghost"
      })}
      size={figma.enum("Size", {
        "Small": "sm",
        "Medium": "md",
        "Large": "lg"
      })}
      disabled={figma.boolean("Disabled")}
    >
      {figma.string("Label")}
    </Button>
  `,
  templateDataJson: JSON.stringify({
    isParserless: true,
    imports: ["import { Button } from '@/components/ui/Button'"],
    props: {
      variant: { type: "enum", figmaName: "Variant" },
      size: { type: "enum", figmaName: "Size" },
      disabled: { type: "boolean", figmaName: "Disabled" },
      children: { type: "string", figmaName: "Label" }
    }
  })
}
```

## Matriz de Compatibilidad de Labels

| Label | Proyecto | Cuando usar |
|---|---|---|
| React | Next.js, CRA, Remix | Componentes JSX/TSX |
| Vue | Nuxt, Vue 3 | Componentes .vue |
| Svelte | SvelteKit | Componentes .svelte |
| Swift | iOS nativo | UIKit o SwiftUI |
| SwiftUI | iOS con SwiftUI | Vistas SwiftUI |
| Compose | Android Jetpack | Composables |
| Flutter | Flutter | Widgets Dart |
| Web Components | Vanilla, Lit | Custom elements |
| Storybook | Cualquier framework | Stories como referencia |
| Javascript | Vanilla JS | Funciones/clases JS |

Para Oasis Hoteles: **label = "React"**

## Estrategia para Proyectos Multiples

Si tienes varios proyectos que comparten un archivo Figma (ej: design system central):

```
Archivo Figma: "Design System Corporativo"
  ├── Proyecto A: Oasis Hoteles (Next.js)
  │   Label: "React"
  │   Source: github.com/oasis/frontend/src/components/
  │
  ├── Proyecto B: CMS Corporativo (Vue)
  │   Label: "Vue"
  │   Source: github.com/oasis/cms/src/components/
  │
  └── Proyecto C: App Mobile (Flutter)
      Label: "Flutter"
      Source: github.com/oasis/mobile/lib/widgets/

Cada proyecto tiene su propio set de mapeos con label diferente.
get_code_connect_map puede filtrar por label (codeConnectLabel param).
```

## Metricas de Cobertura

```
Code Connect Coverage Report
=============================
Total componentes en Figma: 45
Mapeados a codigo: 32 (71%)
Sin mapeo: 13 (29%)

Sin mapeo — desglose:
- 5 componentes decorativos (no necesitan mapeo)
- 4 componentes nuevos (pendientes de implementar)
- 2 componentes legacy (deprecados en codigo)
- 2 componentes sin equivalente claro
```

Meta: **80%+ de cobertura** para que get_design_context sea confiable.
