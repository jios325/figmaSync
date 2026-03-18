# How to Adopt FigmaSync in Any Project

## Overview

FigmaSync is a project-agnostic toolkit. It works with any UI framework (Ant Design, Material UI, Chakra, Tailwind, Bootstrap, custom) and any code framework (React, Vue, Svelte, Angular, etc.).

## Prerequisites

1. **Claude Code** installed and configured
2. **Figma Desktop** app (not web — needed for plugin bridge)
3. **Figma Personal Access Token** (Settings > Personal access tokens, starts with `figd_`)

## Step 1: Install figma-console-mcp

```bash
claude mcp add figma-console -s user \
  -e FIGMA_ACCESS_TOKEN=figd_YOUR_TOKEN \
  -e ENABLE_MCP_APPS=true \
  -- npx -y figma-console-mcp@latest
```

## Step 2: Install Desktop Bridge Plugin

1. Open Figma Desktop
2. Go to **Plugins > Development > Import plugin from manifest...**
3. Navigate to the manifest file:
   ```bash
   npx figma-console-mcp@latest --print-path
   # Then find: figma-desktop-bridge/manifest.json
   ```
4. Run the plugin in your Figma file
5. Verify: green dot "MCP ready"

## Step 3: Copy Skills to Your Project

```bash
# Option A: Copy all skills
cp -r /path/to/figmaSync/.claude/skills/* /path/to/your-project/.claude/skills/

# Option B: Copy only what you need
cp -r /path/to/figmaSync/.claude/skills/screen-creator /path/to/your-project/.claude/skills/
cp -r /path/to/figmaSync/.claude/skills/design-normalizer /path/to/your-project/.claude/skills/
# etc.
```

## Step 4: Configure for Your Project

### Option A: Let skills auto-discover (recommended)

Skills will read your Figma file and project code to discover:
- Layout patterns (sidebar width, header height, content area)
- Color tokens and typography
- Existing components and their variants
- Naming conventions

No configuration needed — just run the skills.

### Option B: Create a project-specific override

Create `.claude/skills/ui-framework-patterns/SKILL.md` with your specific patterns:

```markdown
---
name: ui-framework-patterns
description: Project-specific UI patterns for [your project name]
---

# UI Framework Patterns

## Framework: [Ant Design 5 / Material UI / Tailwind / etc.]

## Layout
- Sidebar width: [211px]
- Header height: [56px]
- Content padding: [24px]
- Header bg: [#283544]

## Screen types
### List screen
[describe your list pattern]

### Form screen
[describe your form pattern]

## Component mapping
| Your component | Figma equivalent |
|---|---|
| Button | Ant Design Button |
| Table | Ant Design Table |
```

## Step 5: Run Initial Audit

Open Claude Code in your project directory:

```
> Run /design-normalizer on my Figma file [paste URL]
```

This will:
1. Scan the file structure
2. Evaluate token coverage
3. Audit component quality
4. Generate a score and action items

## Step 6: Start Using

### Common workflows

| What you want to do | Command |
|---|---|
| Create a new screen | "Crea la pantalla de [nombre] en Figma" |
| Add component to library | "Agrega este componente a la libreria" |
| Sync tokens | "Sincroniza los tokens de codigo con Figma" |
| Check quality | "Valida la pantalla [nombre]" |
| Detect drift | "Compara Figma con produccion" |
| Map components | "Conecta los componentes de Figma con el codigo" |

## Skill Reference

| Skill | Purpose | Needs Figma Desktop Bridge? |
|---|---|---|
| `figma-sync` | Orchestrator — routes to correct sub-skill | Yes |
| `screen-creator` | Create new screens from existing patterns | Yes |
| `component-library-sync` | Organize component library | Yes |
| `token-sync` | Sync design tokens bidirectionally | Yes |
| `ui-framework-patterns` | CRUD patterns for your UI framework | No (reference only) |
| `variant-generator` | Generate variants from code props | Yes |
| `figma-quality-gate` | Post-creation quality validation | Yes |
| `design-normalizer` | Audit Figma file health | Read-only OK |
| `drift-detection` | Compare Figma vs production | Read-only OK |
| `code-connect-bridge` | Map Figma components to code | Read-only + Code Connect API |

## Troubleshooting

### "Cannot connect to Figma Desktop"
1. Verify Desktop Bridge plugin is running (green dot)
2. Check no stale processes: `lsof -i :9223`
3. Kill stale processes and restart Claude Code

### "Port conflict"
Another instance is using port 9223. Kill it:
```bash
kill $(lsof -t -i :9223)
```
Then restart Claude Code.

### "Skills don't know my patterns"
Run `/design-normalizer` first — it teaches other skills about your file structure.

### "Write operations fail but reads work"
Writes go through the Desktop Bridge plugin (WebSocket). Reads use the REST API (token).
Make sure the plugin is running in Figma Desktop.
