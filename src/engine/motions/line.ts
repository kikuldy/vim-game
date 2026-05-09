import type { BufferState, CommandMeta } from '../types'
import type { MotionEntry } from './hjkl'

// ─── 0 — line start ──────────────────────────────────────────────────────────

const zeroMeta: CommandMeta = {
  key: '0',
  name: 'line start',
  mnemonic: '"0" looks like the beginning — nothing before it',
  category: 'motion',
  description: 'Move cursor to the first character of the line',
  examples: [
    { before: 'hell|o world', after: '|hello world' },
    { before: '|hello world', after: '|hello world' },
  ],
  combinesWith: ['d', 'c', 'y'],
}

function executeZero(state: BufferState, _count: number): BufferState {
  return { ...state, cursor: { line: state.cursor.line, col: 0 } }
}

// ─── $ — line end ───────────────────────────────────────────────────────────

const dollarMeta: CommandMeta = {
  key: '$',
  name: 'line end',
  mnemonic: '"$" means end in many Unix tools',
  category: 'motion',
  description: 'Move cursor to the last character of the line',
  examples: [
    { before: '|hello world', after: 'hello worl|d' },
    { before: 'hello worl|d', after: 'hello worl|d' },
  ],
  combinesWith: ['d', 'c', 'y'],
}

function executeDollar(state: BufferState, _count: number): BufferState {
  const line = state.lines[state.cursor.line] ?? ''
  const col = Math.max(0, line.length - 1)
  return { ...state, cursor: { line: state.cursor.line, col } }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const zero: MotionEntry = { meta: zeroMeta, execute: executeZero, inclusive: false }
export const dollar: MotionEntry = { meta: dollarMeta, execute: executeDollar, inclusive: true }
