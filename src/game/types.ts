import type { BufferState, ParseState, EngineState } from '../engine/types'

// ─── Level ───────────────────────────────────────────────────────────────────

export type Level = {
  readonly id: string
  readonly title: string
  readonly initialBuffer: BufferState
  /**
   * Target text content (lines joined by \n, no trailing newline).
   * For motion-only levels this equals the initial text; completion is
   * determined by goalCursor instead.
   */
  readonly goalBuffer: string
  /**
   * Required cursor position when goalBuffer text is reached.
   * Undefined means "any cursor position is acceptable".
   */
  readonly goalCursor?: { readonly line: number; readonly col: number }
  /** The shortest solution, used only for display after completion. */
  readonly optimalKeys: string
  /**
   * Serialized commands the player is allowed to execute in this level.
   * Any completed VimCommand not in this list is blocked with a hint.
   * e.g. ["l"] or ["dw", "d2w", "2dw"]
   */
  readonly allowedCommands: ReadonlyArray<string>
  readonly introducesCommands: ReadonlyArray<string>
  readonly explanation: {
    readonly breakdown: string
    readonly rationale: string
    readonly variations: ReadonlyArray<string>
  }
}

// ─── Progress ────────────────────────────────────────────────────────────────

export type ProgressData = {
  version: 1
  completedLevels: string[]
  bestKeys: Record<string, string>
}

// ─── Game state ──────────────────────────────────────────────────────────────

export type GameStatus = 'playing' | 'complete'

export type GameState = {
  // data
  readonly levels: ReadonlyArray<Level>
  readonly currentLevelIndex: number
  readonly engineState: EngineState
  readonly parseState: ParseState
  readonly keyHistory: ReadonlyArray<string>
  readonly status: GameStatus
  readonly hint: string | null
  // actions
  pressKey: (key: string) => void
  retry: () => void
  nextLevel: () => void
  previousLevel: () => void
}
