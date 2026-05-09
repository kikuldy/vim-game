import type { VimCommand, EngineState } from '../types'
import { operatorRange, deleteRange, extractRange, bufferToString } from '../buffer-utils'
import { SIMPLE_MOTIONS, FIND_MOTION } from '../motions/registry'
import { deleteLine, extractLines } from '../operators/delete'
import { pasteAfter, pasteBefore } from '../operators/paste'
import type { MotionEntry } from '../motions/hjkl'
import type { BufferState } from '../types'

// ─── Motion resolution ───────────────────────────────────────────────────────

function resolveMotion(cmd: VimCommand & { kind: 'motion' | 'operator+motion' }): {
  entry: MotionEntry
  char?: string
} | null {
  const motion = cmd.kind === 'motion' ? cmd.motion : cmd.motion
  if (typeof motion === 'string') {
    const entry = SIMPLE_MOTIONS.get(motion)
    return entry ? { entry } : null
  }
  // f{char}
  return { entry: { meta: FIND_MOTION.meta, execute: (s, c) => FIND_MOTION.execute(s, c, motion.char), inclusive: FIND_MOTION.inclusive }, char: motion.char }
}

// ─── Executor ────────────────────────────────────────────────────────────────

export function execute(cmd: VimCommand, state: EngineState): EngineState {
  const { buffer, register } = state

  switch (cmd.kind) {
    case 'motion': {
      const resolved = resolveMotion(cmd)
      if (!resolved) return state
      const newBuf = resolved.entry.execute(buffer, cmd.count ?? 1)
      return { buffer: newBuf, register }
    }

    case 'operator+motion': {
      const resolved = resolveMotion(cmd)
      if (!resolved) return state
      const count = cmd.count ?? 1
      const motionResult = resolved.entry.execute(buffer, count)
      const range = operatorRange(buffer, motionResult, resolved.entry.inclusive)
      if (range.start > range.end) return state  // no-op (e.g. w at end of file)

      switch (cmd.operator) {
        case 'd': {
          const yanked = extractRange(buffer, range.start, range.end)
          const newBuf = deleteRange(buffer, range.start, range.end)
          return { buffer: newBuf, register: yanked }
        }
        case 'y': {
          const yanked = extractRange(buffer, range.start, range.end)
          return { buffer, register: yanked }
        }
        case 'c': {
          // change = delete + enter insert mode. For now: delete only.
          // Insert mode is handled by the UI layer.
          const yanked = extractRange(buffer, range.start, range.end)
          const newBuf = deleteRange(buffer, range.start, range.end)
          return { buffer: newBuf, register: yanked }
        }
      }
      break
    }

    case 'line-wise': {
      const count = cmd.count ?? 1
      switch (cmd.operator) {
        case 'd': {
          const yanked = extractLines(buffer, count)
          const newBuf = deleteLine(buffer, count)
          return { buffer: newBuf, register: yanked }
        }
        case 'y': {
          const yanked = extractLines(buffer, count)
          return { buffer, register: yanked }
        }
        case 'c': {
          const yanked = extractLines(buffer, count)
          const newBuf = deleteLine(buffer, count)
          return { buffer: newBuf, register: yanked }
        }
      }
      break
    }

    case 'paste': {
      if (register === null) return state
      const newBuf: BufferState =
        cmd.where === 'after' ? pasteAfter(buffer, register) : pasteBefore(buffer, register)
      return { buffer: newBuf, register }
    }

    case 'operator+text-object':
      // Phase 4 — not implemented yet
      return state
  }

  return state
}

/** Convenience: apply a full command sequence from idle state. */
export function executeAll(cmds: VimCommand[], initial: EngineState): EngineState {
  return cmds.reduce((state, cmd) => execute(cmd, state), initial)
}

/** Stringify a buffer for comparison with goalBuffer. */
export { bufferToString }
