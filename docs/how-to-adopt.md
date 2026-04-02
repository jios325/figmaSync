# How to Adopt FigmaSync in Any Project

## Overview

FigmaSync is a project-agnostic toolkit. It works with any UI framework (Ant Design, Material UI, Chakra, Tailwind, Bootstrap, custom) and any code framework (React, Vue, Svelte, Angular, etc.).

## Prerequisites

1. **Claude Code** installed and configured
2. **Figma account** with access to the files you want to work with

## Step 1: Configure Figma Remote MCP

```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```

This enables all read and write operations via `use_figma`, `get_metadata`, `get_screenshot`, `get_design_context`, `search_design_system`, etc.

## Step 2 (Optional): Install figma-console-mcp for Lint and Real-time Screenshots

Only needed if you want `figma_lint_design` (WCAG audit) and `figma_capture_screenshot` (real-time screenshots via plugin):

```bash
claude mcp add figma-console -s user \
  -e FIGMA_ACCESS_TOKEN=figd_YOUR_TOKEN \
  -e ENABLE_MCP_APPS=true \
  -- npx -y figma-console-mcp@latest
```

This requires Figma Desktop + Desktop Bridge plugin. **This step is entirely optional.**

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

| Skill | Purpose | Needs Desktop Bridge? |
|---|---|---|
| `figma-sync` | Orchestrator — routes to correct sub-skill | No (`use_figma`) |
| `screen-creator` | Create new screens from existing patterns | No (`use_figma`) |
| `component-library-sync` | Organize component library | No (`use_figma`) |
| `token-sync` | Sync design tokens bidirectionally | No (`use_figma`) |
| `ui-framework-patterns` | CRUD patterns for your UI framework | No (reference only) |
| `variant-generator` | Generate variants from code props | No (`use_figma`) |
| `figma-quality-gate` | Post-creation quality validation | Optional (for `figma_lint_design`) |
| `design-normalizer` | Audit Figma file health | No (read-only) |
| `drift-detection` | Compare Figma vs production | No (read-only) |
| `code-connect-bridge` | Map Figma components to code | No (read + Code Connect API) |

## Troubleshooting

### "`use_figma` not available"
Verify Figma Remote MCP is configured:
```bash
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp
```
Then verify authentication with `whoami()`.

### "Skills don't know my patterns"
Run `/design-normalizer` first — it teaches other skills about your file structure.

### "Write operations fail"
Verify that `use_figma` has access to the file. Make sure to load `/figma-use` before executing complex scripts.

### "figma_lint_design not available" (optional)
This tool requires figma-console-mcp with Desktop Bridge. It is optional — you can validate designs manually with `get_screenshot` and `get_metadata` instead.
