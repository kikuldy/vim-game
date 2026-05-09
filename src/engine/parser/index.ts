import type {
  ParseState,
  OperatorKey,
  MotionKey,
  TextObjectScope,
  TextObjectTarget,
  VimCommand,
} from '../types'
import { IDLE } from '../types'

const OPERATORS = new Set<string>(['d', 'c', 'y'])
const SIMPLE_MOTIONS = new Set<string>(['h', 'l', 'j', 'k', 'w', 'b', 'e', '$', 'G'])
const TEXT_OBJECT_TARGETS = new Set<string>(['w', '"', "'", 'p'])

function isOperator(key: string): key is OperatorKey {
  return OPERATORS.has(key)
}

function asSimpleMotion(key: string): MotionKey | null {
  return SIMPLE_MOTIONS.has(key) ? (key as MotionKey) : null
}

function asTextObjectTarget(key: string): TextObjectTarget | null {
  return TEXT_OBJECT_TARGETS.has(key) ? (key as TextObjectTarget) : null
}

function complete(cmd: VimCommand): ParseState {
  return { phase: 'complete', cmd }
}

function fromIdle(key: string): ParseState {
  if (/^[1-9]$/.test(key)) return { phase: 'count', digits: key }
  if (key === '0') return complete({ kind: 'motion', motion: '0' })
  if (isOperator(key)) return { phase: 'operator', op: key }
  if (key === 'g') return { phase: 'g-prefix' }
  if (key === 'f') return { phase: 'await-char' }
  if (key === 'p') return complete({ kind: 'paste', where: 'after' })
  if (key === 'P') return complete({ kind: 'paste', where: 'before' })
  const motion = asSimpleMotion(key)
  if (motion !== null) return complete({ kind: 'motion', motion })
  return { phase: 'invalid' }
}

function fromCount(digits: string, key: string): ParseState {
  const count = parseInt(digits, 10)
  if (/^[0-9]$/.test(key)) return { phase: 'count', digits: digits + key }
  if (isOperator(key)) return { phase: 'operator', op: key, count }
  if (key === 'g') return { phase: 'g-prefix', count }
  if (key === 'f') return { phase: 'await-char', count }
  const motion = asSimpleMotion(key)
  if (key === '0') return complete({ kind: 'motion', motion: '0', count })
  if (motion !== null) return complete({ kind: 'motion', motion, count })
  return { phase: 'invalid' }
}

function fromOperator(op: OperatorKey, count: number | undefined, key: string): ParseState {
  if (key === op) return complete({ kind: 'line-wise', operator: op, count })
  if (key === 'i') return { phase: 'text-object', op, scope: 'inner' }
  if (key === 'a') return { phase: 'text-object', op, scope: 'around' }
  if (key === 'f') return { phase: 'await-char', op, count }
  const motion = asSimpleMotion(key)
  if (key === '0') return complete({ kind: 'operator+motion', operator: op, motion: '0', count })
  if (motion !== null) return complete({ kind: 'operator+motion', operator: op, motion, count })
  return { phase: 'invalid' }
}

function fromTextObject(op: OperatorKey, scope: TextObjectScope, key: string): ParseState {
  const target = asTextObjectTarget(key)
  if (target !== null) return complete({ kind: 'operator+text-object', operator: op, textObject: { scope, target } })
  return { phase: 'invalid' }
}

function fromGPrefix(count: number | undefined, key: string): ParseState {
  if (key === 'g') return complete({ kind: 'motion', motion: 'gg', count })
  return { phase: 'invalid' }
}

function fromAwaitChar(op: OperatorKey | undefined, count: number | undefined, char: string): ParseState {
  const motion: MotionKey = { kind: 'f', char }
  if (op !== undefined) return complete({ kind: 'operator+motion', operator: op, motion, count })
  return complete({ kind: 'motion', motion, count })
}

export function parseKey(state: ParseState, key: string): ParseState {
  if (key === 'Escape') return IDLE

  switch (state.phase) {
    case 'idle':
    case 'complete':
    case 'invalid':
      return fromIdle(key)
    case 'count':
      return fromCount(state.digits, key)
    case 'operator':
      return fromOperator(state.op, state.count, key)
    case 'text-object':
      return fromTextObject(state.op, state.scope, key)
    case 'g-prefix':
      return fromGPrefix(state.count, key)
    case 'await-char':
      return fromAwaitChar(state.op, state.count, key)
  }
}
