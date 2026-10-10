/**
 * Mommy Quests - Revenge compatibility diagnostics.
 *
 * This is intentionally a safe diagnostics build. The upstream desktop quest
 * engine depends on Electron, DiscordNative, desktop Flux stores, and desktop
 * activity APIs that are not available through the mobile Revenge runtime.
 */
let unregisterCommand: (() => unknown) | undefined

function runtimeSummary() {
  const runtime = (globalThis as any).bunny ?? (globalThis as any).revenge
  const discord = runtime?.discord
  const modules = discord?.modules

  return {
    revenge: Boolean(runtime),
    discord: Boolean(discord),
    moduleNamespaceKeys: modules ? Object.keys(modules).slice(0, 30) : [],
    desktopGlobals: {
      window: typeof (globalThis as any).window !== 'undefined',
      discordNative: typeof (globalThis as any).DiscordNative !== 'undefined',
    },
  }
}

const mommyCommand = {
  name: 'mommy',
  description: 'Show the Mommy Quests compatibility status.',
  type: 1,
  options: [],
  shouldHide: () => false,
  execute: () => ({
    content:
      '**Mommy Quests** is loaded.\nThis Revenge build is diagnostics-only; the original quest engine requires Discord Desktop/Vencord.',
  }),
}

export default {
  onLoad: () => {
    console.info('[Mommy Quests] Plugin loaded.')
    console.info(
      '[Mommy Quests] This build is diagnostics-only; the original engine requires Discord Desktop/Vencord.',
    )
    console.info('[Mommy Quests] Runtime:', runtimeSummary())

    try {
      const globals = globalThis as any
      const registerCommand =
        globals.bunny?.api?.commands?.registerCommand ??
        globals.vendetta?.commands?.registerCommand
      if (typeof registerCommand !== 'function') {
        throw new Error('Revenge command API was not found')
      }
      unregisterCommand = registerCommand(mommyCommand)
      console.info('[Mommy Quests] Registered /mommy command.')
    } catch (error) {
      console.error('[Mommy Quests] Failed to register /mommy command:', error)
    }
  },
  onUnload: () => {
    unregisterCommand?.()
    unregisterCommand = undefined
    console.info('[Mommy Quests] Plugin unloaded.')
  },
}
