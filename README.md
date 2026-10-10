# Orion Quests — Revenge experimental plugin

This repository packages an **experimental Revenge plugin** for Discord Android.

## Current status

The plugin is intentionally **diagnostics-only**. It confirms that Revenge can load
an Orion-branded plugin and logs the available mobile runtime/module surface.

The upstream Orion Quest Completer is a Vencord/Discord Desktop project. Its engine
uses Electron, `DiscordNative`, desktop Flux/Webpack stores, desktop activity APIs,
and a native achievement-bypass module. Those APIs are not interchangeable with
Revenge’s Android runtime. Copying the Vencord files into a Revenge plugin would
therefore fail or risk unintended requests.

A functional Android port requires identifying and testing the corresponding mobile
quest modules and implementing a separate mobile transport. This repository is the
safe starting point for that work; it does not automate quests yet.

## Install through Revenge

Add this repository as a Revenge plugin repository, then install **Orion Quests
(Experimental)**. The plugin ID is:

```text
com.lotfff.orion-quests-revenge
```

After enabling it, inspect the Revenge developer/evaluate-JavaScript console for
messages beginning with `[Orion Quests]`.

## Build locally

This repository follows the official Revenge plugin template:

```bash
bun install
bun run build orion-quests-revenge
./gradlew packageOrionQuestsRevenge
```

The packaged artifact is written under `build/dist/`.

## Safety and compatibility

- Android/Discord client modification is unsupported by Discord and may violate
  Discord’s Terms of Service.
- The original Orion project warns that quest automation can trigger quest-access
  restrictions or other account enforcement.
- This repository does not include the original desktop automation engine and does
  not claim Android quest completion support.
