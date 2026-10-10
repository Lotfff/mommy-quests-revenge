/**
 * Mommy Quests - Revenge compatibility scaffold.
 *
 * The upstream Mommy implementation targets Discord Desktop/Vencord and
 * depends on Electron, DiscordNative, desktop Flux stores, and desktop-only
 * activity APIs. Revenge runs inside Discord Android, so those assumptions
 * cannot be reused safely. This plugin deliberately performs diagnostics only
 * until the required mobile quest modules are identified and tested.
 */

function getRevenge() {
  return globalThis.revenge;
}

function describeRuntime() {
  const runtime = getRevenge();
  const discord = runtime && runtime.discord;
  const modules = discord && discord.modules;
  return {
    revenge: Boolean(runtime),
    discord: Boolean(discord),
    moduleNamespaceKeys: modules ? Object.keys(modules).slice(0, 30) : [],
    desktopGlobals: {
      window: typeof globalThis.window !== "undefined",
      discordNative: typeof globalThis.DiscordNative !== "undefined",
    },
  };
}

export default plugin({
  start() {
    console.info("[Mommy Quests] Revenge plugin loaded.");
    console.info(
      "[Mommy Quests] This build is diagnostics-only; the upstream engine requires Discord Desktop/Vencord.",
    );
    console.info("[Mommy Quests] Runtime:", describeRuntime());
  },
  stop() {
    console.info("[Mommy Quests] Revenge plugin unloaded.");
  },
});
