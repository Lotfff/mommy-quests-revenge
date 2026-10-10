/**
 * Mommy Quests - Revenge compatibility diagnostics.
 *
 * This is intentionally a safe diagnostics build. The upstream desktop quest
 * engine depends on Electron, DiscordNative, desktop Flux stores, and desktop
 * activity APIs that are not available through the mobile Revenge runtime.
 */

function runtimeSummary() {
  const runtime = (globalThis as any).revenge
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

export default {
  onLoad: () => {
    console.info('[Mommy Quests] Plugin loaded.')
    console.info(
      '[Mommy Quests] This build is diagnostics-only; the original engine requires Discord Desktop/Vencord.',
    )
    console.info('[Mommy Quests] Runtime:', runtimeSummary())
  },
  onUnload: () => {
    console.info('[Mommy Quests] Plugin unloaded.')
  },
}
