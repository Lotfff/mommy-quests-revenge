/**
 * Mommy Quests - Android Revenge mobile engine.
 *
 * The mobile client has no Electron process APIs, so game/stream/achievement tasks
 * cannot be spoofed safely. This engine uses Discord's own mobile request module
 * for quest discovery, enrollment, status, and video progress, while reporting
 * unsupported task types honestly.
 */
let unregisterCommand: (() => unknown) | undefined
let running = false
let controller: AbortController | undefined
let lastSnapshot: QuestSnapshot[] = []

const runtime = () => (globalThis as any).bunny ?? (globalThis as any).revenge

function metroFindByProps(...props: string[]): any {
  try {
    return runtime()?.metro?.findByProps?.(...props)
  } catch {
    return undefined
  }
}

function restModule(): any {
  const api = metroFindByProps('get', 'post', 'put') ?? metroFindByProps('get', 'post')
  return api && typeof api.get === 'function' && typeof api.post === 'function' ? api : undefined
}

function unwrap(value: any): any {
  return value?.body ?? value?.data ?? value
}

async function request(method: 'get' | 'post', url: string, body?: any): Promise<any> {
  const api = restModule()
  if (!api) throw new Error('Discord mobile request module was not found; restart Revenge and try again.')
  const fn = api[method]
  const attempts = body === undefined
    ? [{ url }, url]
    : [{ url, body }, { url, data: body }, url, body]
  let lastError: unknown
  for (const args of attempts) {
    try {
      return unwrap(await fn.call(api, args))
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function questStore(): any {
  try {
    return runtime()?.metro?.findByStoreName?.('QuestStore')
  } catch {
    return undefined
  }
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value
  if (value instanceof Map) return [...value.values()]
  if (value && typeof value === 'object') return Object.values(value)
  return []
}

async function loadQuests(): Promise<any[]> {
  const store = questStore()
  for (const candidate of [store?.getQuests?.(), store?.quests, store?.questMap]) {
    const quests = asArray(candidate)
    if (quests.length) return quests
  }
  const body = await request('get', '/quests/@me')
  const quests = asArray(body?.quests ?? body)
  if (!quests.length) throw new Error('Discord returned no quests. Open the Quests page once, then retry.')
  return quests
}

function taskEntries(tasks: any): Array<[string, any]> {
  if (tasks instanceof Map) return [...tasks.entries()]
  return tasks && typeof tasks === 'object' ? Object.entries(tasks) : []
}

function taskConfig(quest: any): any {
  const config = quest?.config ?? quest
  const v2 = config?.taskConfigV2
  if (taskEntries(v2?.tasks).length) return v2
  return config?.taskConfig ?? v2
}

function taskFor(quest: any): Array<[string, any]> {
  const config = taskConfig(quest)
  return taskEntries(config?.tasks)
}

function questName(quest: any): string {
  return quest?.config?.messages?.questName
    ?? quest?.config?.name
    ?? quest?.name
    ?? `Quest ${quest?.id ?? 'unknown'}`
}

function targetFor(task: any): number {
  return Number(task?.target ?? task?.value ?? task?.duration ?? 0)
}

function isComplete(quest: any): boolean {
  return Boolean(quest?.userStatus?.completedAt || quest?.userStatus?.claimedAt || quest?.completedAt)
}

function isEnrolled(quest: any): boolean {
  return Boolean(quest?.userStatus?.enrolledAt || quest?.userStatus?.enrolled_at)
}

function taskKind(key: string): 'video' | 'unsupported' {
  return key.includes('VIDEO') ? 'video' : 'unsupported'
}

interface QuestSnapshot {
  id: string
  name: string
  task: string
  kind: string
  target: number
  progress: number
  status: string
  reason?: string
}

function snapshotLine(s: QuestSnapshot): string {
  const pct = s.target > 0 ? `${Math.min(100, Math.round((s.progress / s.target) * 100))}%` : '?'
  return `• ${s.name}: ${s.status} (${pct}) [${s.task}]${s.reason ? ` — ${s.reason}` : ''}`
}

function mobileSummary(): string {
  const runtimeReady = Boolean(runtime())
  const restReady = Boolean(restModule())
  const storeReady = Boolean(questStore())
  return `Revenge mobile: ${runtimeReady ? 'loaded' : 'not detected'}; request module: ${restReady ? 'found' : 'missing'}; QuestStore: ${storeReady ? 'found' : 'not found'}; engine: ${running ? 'running' : 'idle'}.`
}

async function enroll(quest: any): Promise<void> {
  if (isEnrolled(quest) || isComplete(quest)) return
  try {
    await request('post', `/quests/${quest.id}/enroll`, {})
  } catch (error) {
    console.warn('[Mommy Quests] Could not enroll quest:', quest.id, error)
  }
}

async function runVideo(quest: any, taskKey: string, task: any, signal: AbortSignal): Promise<QuestSnapshot> {
  const target = targetFor(task)
  let progress = Number(task?.progress ?? quest?.userStatus?.progress?.[taskKey]?.value ?? 0)
  const result: QuestSnapshot = { id: String(quest.id), name: questName(quest), task: taskKey, kind: 'video', target, progress, status: 'RUNNING' }
  if (!(target > 0)) return { ...result, status: 'SKIPPED', reason: 'Discord supplied no valid video target.' }
  while (progress < target && !signal.aborted) {
    await new Promise<void>(resolve => setTimeout(resolve, 7000 + Math.floor(Math.random() * 2500)))
    if (signal.aborted) break
    progress = Math.min(target, progress + 7.5)
    const body = await request('post', `/quests/${quest.id}/video-progress`, { timestamp: Number(progress.toFixed(3)) })
    const serverProgress = Number(body?.progress?.[taskKey]?.value ?? body?.progress?.WATCH_VIDEO?.value ?? 0)
    if (serverProgress > progress) progress = Math.min(target, serverProgress)
    result.progress = progress
  }
  result.status = signal.aborted ? 'STOPPED' : progress >= target ? 'COMPLETED' : 'FAILED'
  return result
}

async function runEngine(): Promise<void> {
  if (running) return
  running = true
  controller = new AbortController()
  const signal = controller.signal
  try {
    const quests = await loadQuests()
    const snapshots: QuestSnapshot[] = []
    for (const quest of quests) {
      if (signal.aborted || isComplete(quest)) continue
      await enroll(quest)
      const entries = taskFor(quest)
      const video = entries.find(([key]) => taskKind(key) === 'video')
      if (!video) {
        const key = entries[0]?.[0] ?? 'NO_TASK'
        snapshots.push({ id: String(quest.id), name: questName(quest), task: key, kind: 'unsupported', target: 0, progress: 0, status: 'SKIPPED', reason: 'Android Revenge cannot spoof desktop game, stream, activity, or achievement tasks.' })
        continue
      }
      try {
        snapshots.push(await runVideo(quest, video[0], video[1], signal))
      } catch (error) {
        snapshots.push({ id: String(quest.id), name: questName(quest), task: video[0], kind: 'video', target: targetFor(video[1]), progress: 0, status: 'FAILED', reason: error instanceof Error ? error.message : String(error) })
      }
    }
    lastSnapshot = snapshots
    console.info('[Mommy Quests] Run finished:', snapshots)
  } catch (error) {
    console.error('[Mommy Quests] Run failed:', error)
    throw error
  } finally {
    running = false
    controller = undefined
  }
}

function argsObject(args: any[]): Record<string, any> {
  const out: Record<string, any> = {}
  for (const arg of args ?? []) if (arg?.name) out[arg.name] = arg.value
  return out
}

const mommyCommand = {
  name: 'mommy',
  description: 'Run Mommy Quests on Android Revenge',
  type: 1,
  options: [
    {
      name: 'action',
      description: 'Choose what Mommy Quests should do',
      type: 3,
      required: true,
      choices: [
        { name: 'Start', value: 'start' },
        { name: 'Stop', value: 'stop' },
        { name: 'Status', value: 'status' },
      ],
    },
    { name: 'quest', description: 'Optional quest name or ID for status filtering', type: 3, required: false },
  ],
  execute: async (args: any[]) => {
    const values = argsObject(args)
    const action = String(values.action ?? '').toLowerCase()
    if (action === 'start') {
      if (running) return { content: '**Mommy Quests** is already running.\n' + mobileSummary() }
      void runEngine().catch(() => undefined)
      return { content: '**Mommy Quests** started on Android Revenge.\n' + mobileSummary() + '\nVideo quests are supported; unsupported mobile task types will be listed in `/mommy status`.' }
    }
    if (action === 'stop') {
      controller?.abort()
      return { content: '**Mommy Quests** stop requested.\n' + mobileSummary() }
    }
    if (action === 'status' || action === 'summary') {
      const wanted = values.quest ? String(values.quest).toLowerCase() : ''
      const rows = lastSnapshot.filter(row => !wanted || row.id === wanted || row.name.toLowerCase().includes(wanted))
      return { content: `**Mommy Quests**\n${mobileSummary()}\n${rows.length ? rows.map(snapshotLine).join('\n') : 'No run results yet. Use `/mommy action:start`.'}` }
    }
    return { content: `**Mommy Quests**\nNo valid action was received. Select **Start**, **Stop**, or **Status** from the action picker.\n${mobileSummary()}` }
  },
}

export default {
  onLoad: () => {
    console.info('[Mommy Quests] Android mobile engine loaded.')
    console.info('[Mommy Quests]', mobileSummary())
    try {
      const registerCommand = runtime()?.api?.commands?.registerCommand ?? (globalThis as any).vendetta?.commands?.registerCommand
      if (typeof registerCommand !== 'function') throw new Error('Revenge command API was not found')
      unregisterCommand = registerCommand(mommyCommand)
      console.info('[Mommy Quests] Registered /mommy with action and quest options.')
    } catch (error) {
      console.error('[Mommy Quests] Failed to register /mommy:', error)
    }
  },
  onUnload: () => {
    controller?.abort()
    unregisterCommand?.()
    unregisterCommand = undefined
    console.info('[Mommy Quests] Android mobile engine unloaded.')
  },
}
