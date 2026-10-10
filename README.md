# Mommy Quests — Revenge plugin

A legacy Vendetta/Revenge-format plugin for Discord Android.

## Install in Revenge

Add this plugin URL in Revenge:

```text
https://lotfff.github.io/mommy-quests-revenge/MommyQuests/
```

Revenge loads the generated `manifest.json` and `index.js` from that directory.

## Android engine status

This release includes a real mobile engine. It discovers Discord's internal
Android request module and QuestStore, loads current quests, enrolls available
quests, reports status, and completes video quests through Discord's
`video-progress` endpoint.

Android Discord does not expose the desktop process/activity APIs or Electron
native module needed to spoof game, stream, activity, or achievement tasks. Those
tasks are listed as **SKIPPED** with an explanation rather than being falsely
reported as completed.

## Desktop Vencord plugin

The full desktop engine from the uploaded quest-completer project is included as
the renamed `MommyQuests` Vencord userplugin in
[`vencord/MommyQuests/`](vencord/MommyQuests/). It includes the quest engine,
settings, native helper, progress handling, pause/resume controls, and the
`/mommy` command with `start`, `stop`, `status`, `pause`, and `resume` actions.

This desktop plugin must be installed through Vencord's userplugin workflow; it
cannot run in the Android Revenge plugin loader. See its
[`README.md`](vencord/MommyQuests/README.md) and
[`docs/VENCORD-PLUGIN.md`](vencord/MommyQuests/docs/VENCORD-PLUGIN.md) for setup.

## Android command

After enabling the plugin, use the command picker and select `/mommy`. Fill in the
`action` option with one of:

```text
/mommy action:start
/mommy action:stop
/mommy action:status
```

An optional `quest` value filters the status output by quest ID or name.

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
Service and may result in account restrictions. Use this at your own risk.
