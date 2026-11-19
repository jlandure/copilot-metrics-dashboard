import type { CustomizationEntry, CustomizationKind } from '@/types/copilot'

// Keep this catalog aligned with the sources and exceptions in COPILOT_DEFAULT.md.
const BUILT_IN_NAMES: Record<CustomizationKind, ReadonlySet<string>> = {
  custom_agent: new Set([
    'code-review', 'explore', 'general-purpose', 'research', 'rubber-duck', 'security-review',
    'task', 'search-subagent'
  ]),
  mcp: new Set(['github-mcp-server', 'ide']),
  skill: new Set([
    'af', 'agent-merge', 'create-canvas', 'orchestrate', 'pr-stack', 'customize-cloud-agent',
    'automate'
  ]),
  plugin: new Set(),
  // Canonical command names and aliases; telemetry may omit the leading slash.
  slash_cmd: new Set(`
    add-dir after agent agents allow-all app ask autopilot branch btw bug caffeinate cd
    changelog chronicle clear clikit collect-debug-logs compact config context continue
    copy cwd delegate diagnose diff downgrade env every exit experimental export extension
    extensions feedback find fleet footer fork goal help ide init instructions keep-alive
    limits list-dirs login logout lsp mcp model models move new permissions plan plugin pr
    quit refine release-notes remote rename research reset reset-allowed-tools restart resume
    review rewind rubber-duck sandbox search security-review session sessions settings share
    skills statusline subagents tasks terminal-setup theme tuikit undo update upgrade usage
    user version vim voice workflows worktree yolo
    af allow-all-tools attach-files attach-folder create-canvas debug export-gist inbox
    interactive merge-to-parent orchestrate pr-fix-checks pr-merge pr-open pr-resolve-comments
    restart-session spar spawn terminal
    automate computer pr-stack
  `.trim().split(/\s+/))
}

export function isCopilotDefault(
  kind: CustomizationKind,
  entry: Pick<CustomizationEntry, 'name' | 'bucket'>
): boolean {
  if (entry.bucket) return false
  const name = entry.name.trim().toLowerCase()
  return BUILT_IN_NAMES[kind].has(kind === 'slash_cmd' ? name.replace(/^\//, '') : name)
}
