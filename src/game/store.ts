import { create } from 'zustand'
import { parseKey } from '../engine/parser'
import { execute } from '../engine/executor'
import { serializeCommand } from '../engine/explainer'
import { bufferToString } from '../engine/buffer-utils'
import { IDLE } from '../engine/types'
import { ALL_LEVELS } from './levels'
import type { GameState, Level, ProgressData } from './types'
import type { EngineState } from '../engine/types'

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'vim-game-progress'

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, completedLevels: [], bestKeys: {} }
    const parsed = JSON.parse(raw) as ProgressData
    if (parsed.version !== 1) return { version: 1, completedLevels: [], bestKeys: {} }
    return parsed
  } catch {
    return { version: 1, completedLevels: [], bestKeys: {} }
  }
}

function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // ignore write errors (e.g. in test environments)
  }
}

// ─── Initial state helpers ────────────────────────────────────────────────────

function engineFor(level: Level): EngineState {
  return { buffer: level.initialBuffer, register: null }
}

function isLevelComplete(engineState: EngineState, level: Level): boolean {
  const textOk = bufferToString(engineState.buffer) === level.goalBuffer
  if (!textOk) return false
  if (level.goalCursor === undefined) return true
  const { line, col } = engineState.buffer.cursor
  return line === level.goalCursor.line && col === level.goalCursor.col
}

function hintFor(levelAllowed: ReadonlyArray<string>, attempted: string): string {
  return `"${attempted}" 在本关不适用。本关接受：${levelAllowed.join('、')}`
}

// ─── Store ───────────────────────────────────────────────────────────────────

const firstLevel = ALL_LEVELS[0]!

export const useGameStore = create<GameState>((set, get) => ({
  levels: ALL_LEVELS,
  currentLevelIndex: 0,
  engineState: engineFor(firstLevel),
  parseState: IDLE,
  keyHistory: [],
  status: 'playing',
  hint: null,

  pressKey: (key: string) => {
    const { parseState, engineState, levels, currentLevelIndex, status, keyHistory } = get()
    if (status === 'complete') return

    const level = levels[currentLevelIndex]
    if (!level) return

    const newParseState = parseKey(parseState, key)

    // Always append the raw key to history (shows "d_" pending state in UI)
    const newKeyHistory = [...keyHistory, key]

    if (newParseState.phase === 'complete') {
      const cmd = newParseState.cmd
      const serialized = serializeCommand(cmd)

      // Block disallowed commands
      if (!level.allowedCommands.includes(serialized)) {
        set({ parseState: IDLE, hint: hintFor(level.allowedCommands, serialized), keyHistory: newKeyHistory })
        return
      }

      // Execute command
      const newEngineState = execute(cmd, engineState)
      const complete = isLevelComplete(newEngineState, level)

      if (complete) {
        // Save progress
        const progress = loadProgress()
        if (!progress.completedLevels.includes(level.id)) {
          progress.completedLevels.push(level.id)
        }
        const keysStr = newKeyHistory.join('')
        if (!progress.bestKeys[level.id] || keysStr.length < progress.bestKeys[level.id]!.length) {
          progress.bestKeys[level.id] = keysStr
        }
        saveProgress(progress)
      }

      set({
        engineState: newEngineState,
        parseState: IDLE,
        keyHistory: newKeyHistory,
        status: complete ? 'complete' : 'playing',
        hint: null,
      })
    } else if (newParseState.phase === 'invalid') {
      // Silently drop unrecognized keys (don't pollute key history display)
      set({ parseState: IDLE })
    } else {
      // Pending state: operator typed, waiting for motion
      set({ parseState: newParseState, keyHistory: newKeyHistory })
    }
  },

  retry: () => {
    const { levels, currentLevelIndex } = get()
    const level = levels[currentLevelIndex]
    if (!level) return
    set({
      engineState: engineFor(level),
      parseState: IDLE,
      keyHistory: [],
      status: 'playing',
      hint: null,
    })
  },

  nextLevel: () => {
    const { currentLevelIndex, levels } = get()
    const nextIndex = currentLevelIndex + 1
    if (nextIndex >= levels.length) return
    const next = levels[nextIndex]!
    set({
      currentLevelIndex: nextIndex,
      engineState: engineFor(next),
      parseState: IDLE,
      keyHistory: [],
      status: 'playing',
      hint: null,
    })
  },

  previousLevel: () => {
    const { currentLevelIndex, levels } = get()
    const prevIndex = currentLevelIndex - 1
    if (prevIndex < 0) return
    const prev = levels[prevIndex]!
    set({
      currentLevelIndex: prevIndex,
      engineState: engineFor(prev),
      parseState: IDLE,
      keyHistory: [],
      status: 'playing',
      hint: null,
    })
  },
}))
