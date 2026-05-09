import type { BufferState, CommandMeta } from '../types'
import type { MotionEntry } from './hjkl'

import { toFlatIdx, fromFlatIdx } from '../buffer-utils'

// ─── Flat-string helpers ─────────────────────────────────────────────────────

type CharClass = 'word' | 'punct' | 'space'

function charClass(ch: string): CharClass {
  if (/\s/.test(ch)) return 'space'
  if (/[a-zA-Z0-9_]/.test(ch)) return 'word'
  return 'punct'
}

function flatText(lines: ReadonlyArray<string>): string {
  return lines.join('\n')
}

// ─── Motion algorithms ───────────────────────────────────────────────────────

function wFlat(text: string, idx: number): number {
  const len = text.length
  if (idx >= len) return len - 1
  const cls = charClass(text[idx]!)
  // Skip current class (non-space)
  if (cls !== 'space') {
    while (idx < len && charClass(text[idx]!) === cls) idx++
  }
  // Skip whitespace
  while (idx < len && charClass(text[idx]!) === 'space') idx++
  return Math.min(idx, len - 1)
}

function bFlat(text: string, idx: number): number {
  if (idx <= 0) return 0
  idx-- // step back from current position
  // Skip whitespace backward
  while (idx > 0 && charClass(text[idx]!) === 'space') idx--
  if (charClass(text[idx]!) === 'space') return idx // entire prefix was whitespace
  const cls = charClass(text[idx]!)
  // Skip same class backward to find start
  while (idx > 0 && charClass(text[idx - 1]!) === cls) idx--
  return idx
}

function eFlat(text: string, idx: number): number {
  const len = text.length
  if (idx >= len - 1) return len - 1
  idx++ // start looking from the next position
  // Skip whitespace
  while (idx < len - 1 && charClass(text[idx]!) === 'space') idx++
  const cls = charClass(text[idx]!)
  // Advance while next char is same class
  while (idx < len - 1 && charClass(text[idx + 1]!) === cls) idx++
  return idx
}

function applyMotion(
  fn: (text: string, idx: number) => number,
  state: BufferState,
  count: number,
): BufferState {
  const text = flatText(state.lines)
  let idx = toFlatIdx(state.lines, state.cursor.line, state.cursor.col)
  for (let i = 0; i < count; i++) idx = fn(text, idx)
  const cursor = fromFlatIdx(state.lines, idx)
  return { ...state, cursor }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

const wMeta: CommandMeta = {
  key: 'w',
  name: 'word forward',
  mnemonic: '"w" for word',
  category: 'motion',
  description: 'Move to the start of the next word',
  examples: [
    { before: '|hello world', after: 'hello |world' },
    { before: '|hello', after: 'hell|o' },
  ],
  combinesWith: ['d', 'c', 'y'],
}

const bMeta: CommandMeta = {
  key: 'b',
  name: 'word backward',
  mnemonic: '"b" for backward',
  category: 'motion',
  description: 'Move to the start of the previous (or current) word',
  examples: [
    { before: 'hello wo|rld', after: 'hello |world' },
    { before: 'hello |world', after: '|hello world' },
  ],
  combinesWith: ['d', 'c', 'y'],
}

const eMeta: CommandMeta = {
  key: 'e',
  name: 'word end',
  mnemonic: '"e" for end',
  category: 'motion',
  description: 'Move to the end of the current (or next) word',
  examples: [
    { before: '|hello world', after: 'hell|o world' },
    { before: 'hell|o world', after: 'hello worl|d' },
  ],
  combinesWith: ['d', 'c', 'y'],
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const w: MotionEntry = {
  meta: wMeta,
  execute: (state, count) => applyMotion(wFlat, state, count),
  inclusive: false,
}

export const b: MotionEntry = {
  meta: bMeta,
  execute: (state, count) => applyMotion(bFlat, state, count),
  inclusive: false,
}

export const e: MotionEntry = {
  meta: eMeta,
  execute: (state, count) => applyMotion(eFlat, state, count),
  inclusive: true,
}
