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

## Step 1b: Alternative — Use Official Figma MCP (no Desktop Bridge needed)

If you don't have Figma Desktop or prefer not to install the Desktop Bridge plugin:

```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

This gives you access to `use_figma` for write operations and all read tools. No Desktop app required.

**Trade-offs vs Desktop Bridge:**
- Fewer dedicated tools (1 generic `use_figma` vs 15+ specialized tools)
- No `figma_lint_design` or real-time `figma_capture_screenshot`
- Beta — will be paid in the future
- Works from any machine without Figma Desktop

See `docs/decisions/05-official-mcp-write-channel.md` for full comparison.

## Step 2: Install Desktop Bridge Plugin (skip if using Step 1b)

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

| Skill | Purpose | Desktop Bridge | use_figma |
|---|---|---|---|
| `figma-sync` | Orchestrator — routes to correct sub-skill | Yes | Yes |
| `screen-creator` | Create new screens from existing patterns | Yes | Yes |
| `component-library-sync` | Organize component library | Yes | Yes |
| `token-sync` | Sync design tokens bidirectionally | Yes | Yes |
| `ui-framework-patterns` | CRUD patterns for your UI framework | No | No (reference) |
| `variant-generator` | Generate variants from code props | Yes | Yes |
| `figma-quality-gate` | Post-creation quality validation | Yes | Partial (no lint) |
| `design-normalizer` | Audit Figma file health | Read-only | Read-only |
| `drift-detection` | Compare Figma vs production | Read-only | Read-only |
| `code-connect-bridge` | Map Figma components to code | Read-only | Read-only |
| `design-system-health` | DS health dashboard + analytics | Read-only | Read-only |

## Enterprise Features (optional)

These features require specific Figma plans and enrich the toolkit:

| Feature | Required Plan | Skills that Use It |
|---|---|---|
| Extended Variable Collections (theming) | Enterprise | `token-sync`, `normalization-pipeline` |
| Library Analytics API | Enterprise | `drift-detection`, `design-system-health` |
| Code Connect UI (native) | Organization+ | `code-connect-bridge` |
| Check Designs linter | All plans | `figma-quality-gate`, `design-normalizer` |

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

### "use_figma not available"
Verify Figma Remote MCP is configured:
```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```
Then verify with `whoami` tool.

### "Extended Collections fails"
Extended Variable Collections requires Enterprise plan. On Professional, use modes within a single collection (max 4 modes).
