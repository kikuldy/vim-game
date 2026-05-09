import type { VimCommand, MotionKey } from './types'

// ─── Serialization ───────────────────────────────────────────────────────────

function motionToStr(motion: MotionKey): string {
  if (typeof motion === 'string') return motion
  return `f${motion.char}`
}

/**
 * Serialize a VimCommand back to the canonical key string a player would type.
 * e.g. { kind:'operator+motion', operator:'d', motion:'w', count:2 } → "2dw"
 *
 * Used by:
 *   1. The game store to check cmd against Level.allowedCommands
 *   2. The explainer to produce Explanation.commandStr
 */
export function serializeCommand(cmd: VimCommand): string {
  switch (cmd.kind) {
    case 'motion': {
      const m = motionToStr(cmd.motion)
      return cmd.count !== undefined ? `${cmd.count}${m}` : m
    }
    case 'operator+motion': {
      const m = motionToStr(cmd.motion)
      const base = `${cmd.operator}${m}`
      return cmd.count !== undefined ? `${cmd.count}${base}` : base
    }
    case 'line-wise': {
      // dd / yy / cc (operator doubled)
      const base = `${cmd.operator}${cmd.operator}`
      return cmd.count !== undefined ? `${cmd.count}${base}` : base
    }
    case 'operator+text-object': {
      const scope = cmd.textObject.scope === 'inner' ? 'i' : 'a'
      return `${cmd.operator}${scope}${cmd.textObject.target}`
    }
    case 'paste':
      return cmd.where === 'after' ? 'p' : 'P'
  }
}
