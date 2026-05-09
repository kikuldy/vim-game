import type { BufferState, CommandMeta } from '../types'

export type MotionFn = (buf: BufferState, count: number) => BufferState

export type MotionEntry = {
  readonly meta: CommandMeta
  readonly execute: MotionFn
  /** Whether the landing character is included in an operator range (vim "inclusive"). */
  readonly inclusive: boolean
}

// ─── h ──────────────────────────────────────────────────────────────────────

const hMeta: CommandMeta = {
  key: 'h',
  name: 'left',
  mnemonic: '"h" is the leftmost key on the hjkl row',
  category: 'motion',
  description: 'Move cursor left one character',
  examples: [
    { before: 'hell|o', after: 'hel|lo' },
    { before: '|hello', after: '|hello' },
  ],
}

function executeH(state: BufferState, count: number): BufferState {
  const newCol = Math.max(0, state.cursor.col - count)
  return { ...state, cursor: { ...state.cursor, col: newCol } }
}

// ─── l ──────────────────────────────────────────────────────────────────────

const lMeta: CommandMeta = {
  key: 'l',
  name: 'right',
  mnemonic: '"l" is the rightmost key on the hjkl row',
  category: 'motion',
  description: 'Move cursor right one character',
  examples: [
    { before: '|hello', after: 'h|ello' },
    { before: 'hell|o', after: 'hell|o' },
  ],
}

function executeL(state: BufferState, count: number): BufferState {
  const line = state.lines[state.cursor.line] ?? ''
  // In normal mode the cursor can sit on the last character but not past it.
  // An empty line keeps the cursor at col 0.
  const maxCol = Math.max(0, line.length - 1)
  const newCol = Math.min(maxCol, state.cursor.col + count)
  return { ...state, cursor: { ...state.cursor, col: newCol } }
}

// ─── j ──────────────────────────────────────────────────────────────────────

const jMeta: CommandMeta = {
  key: 'j',
  name: 'down',
  mnemonic: '"j" has a downward hook at the bottom',
  category: 'motion',
  description: 'Move cursor down one line',
  examples: [
    { before: '|foo\nbar', after: 'foo\n|bar' },
    { before: 'foo\n|bar', after: 'foo\n|bar' },
  ],
}

function executeJ(state: BufferState, count: number): BufferState {
  const newLine = Math.min(state.lines.length - 1, state.cursor.line + count)
  const newLineStr = state.lines[newLine] ?? ''
  const maxCol = Math.max(0, newLineStr.length - 1)
  const newCol = Math.min(maxCol, state.cursor.col)
  return { ...state, cursor: { line: newLine, col: newCol } }
}

// ─── k ──────────────────────────────────────────────────────────────────────

const kMeta: CommandMeta = {
  key: 'k',
  name: 'up',
  mnemonic: '"k" points upward',
  category: 'motion',
  description: 'Move cursor up one line',
  examples: [
    { before: 'foo\n|bar', after: '|foo\nbar' },
    { before: '|foo\nbar', after: '|foo\nbar' },
  ],
}

function executeK(state: BufferState, count: number): BufferState {
  const newLine = Math.max(0, state.cursor.line - count)
  const newLineStr = state.lines[newLine] ?? ''
  const maxCol = Math.max(0, newLineStr.length - 1)
  const newCol = Math.min(maxCol, state.cursor.col)
  return { ...state, cursor: { line: newLine, col: newCol } }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const h: MotionEntry = { meta: hMeta, execute: executeH, inclusive: false }
export const l: MotionEntry = { meta: lMeta, execute: executeL, inclusive: true }
export const j: MotionEntry = { meta: jMeta, execute: executeJ, inclusive: false }
export const k: MotionEntry = { meta: kMeta, execute: executeK, inclusive: false }
