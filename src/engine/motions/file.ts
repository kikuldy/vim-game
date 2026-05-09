import type { BufferState, CommandMeta } from '../types'
import type { MotionEntry } from './hjkl'

// ─── gg — file start ─────────────────────────────────────────────────────────

const ggMeta: CommandMeta = {
  key: 'gg',
  name: 'file start',
  mnemonic: '"gg" — go go, all the way to the top',
  category: 'motion',
  description: 'Move cursor to the first character of the first line',
  examples: [
    { before: 'foo\nba|r', after: '|foo\nbar' },
    { before: '|foo\nbar', after: '|foo\nbar' },
  ],
}

function executeGg(state: BufferState, _count: number): BufferState {
  return { ...state, cursor: { line: 0, col: 0 } }
}

// ─── G — file end ────────────────────────────────────────────────────────────

const gMeta: CommandMeta = {
  key: 'G',
  name: 'file end',
  mnemonic: '"G" — Go to the bottom (capital = big move)',
  category: 'motion',
  description: 'Move cursor to the first character of the last line',
  examples: [
    { before: '|foo\nbar', after: 'foo\n|bar' },
    { before: 'foo\n|bar', after: 'foo\n|bar' },
  ],
}

function executeG(state: BufferState, _count: number): BufferState {
  const line = state.lines.length - 1
  return { ...state, cursor: { line, col: 0 } }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const gg: MotionEntry = { meta: ggMeta, execute: executeGg, inclusive: false }
export const G: MotionEntry = { meta: gMeta, execute: executeG, inclusive: false }
