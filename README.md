# Mommy Quests — Revenge plugin

A legacy Vendetta/Revenge-format plugin for Discord Android.

## Install in Revenge

Add this plugin URL in Revenge:

```text
https://lotfff.github.io/mommy-quests-revenge/MommyQuests/
```

Revenge loads the generated `manifest.json` and `index.js` from that directory.

## Current status

This release is a **diagnostics-only compatibility build**. It confirms that the
plugin loads in the mobile Revenge runtime and logs the available runtime/module
surface.

The original desktop quest engine is not copied into this plugin because it relies
on Electron, `DiscordNative`, desktop Flux/Webpack stores, desktop activity APIs,
and a desktop-only native module. Those APIs are not interchangeable with Revenge
on Android. A full Android port would require separate mobile API discovery and
real-device testing.

## Command

After enabling the plugin, open Discord's chat command picker and choose `/mommy`.
It confirms that the plugin is loaded and explains the current diagnostics-only
compatibility status. The command is registered when the plugin loads and removed
again when it unloads.

## Build locally

The repository follows the legacy build layout used by working Revenge plugins:

```bash
bun install
bun run build
```

The output is written to:

```text
dist/MommyQuests/manifest.json
dist/MommyQuests/index.js
```

The GitHub Actions workflow publishes `dist/` to GitHub Pages automatically on
pushes to `main`.

## Warning

Discord client modifications and quest automation may violate Discord’s Terms of
Service and may result in account restrictions. This diagnostics build does not
automate quests.
