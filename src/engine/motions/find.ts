import type { BufferState, CommandMeta } from '../types'

export type FindMotionEntry = {
  readonly meta: CommandMeta
  readonly execute: (state: BufferState, count: number, char: string) => BufferState
  readonly inclusive: boolean
}

const fMeta: CommandMeta = {
  key: 'f',
  name: 'find character',
  mnemonic: '"f" for find',
  category: 'motion',
  description: 'Move cursor to the next occurrence of a character on the current line',
  examples: [
    { before: '|hello world', after: 'hello w|orld' },   // f + 'w'
    { before: '|hello world', after: 'hell|o world' },   // f + 'o'
  ],
  combinesWith: ['d', 'c', 'y'],
}

function executeF(state: BufferState, count: number, char: string): BufferState {
  const line = state.lines[state.cursor.line] ?? ''
  let remaining = count
  let col = state.cursor.col
  for (let i = col + 1; i < line.length; i++) {
    if (line[i] === char) {
      remaining--
      if (remaining === 0) {
        col = i
        break
      }
    }
  }
  // If char not found (or not enough occurrences), cursor stays put
  return { ...state, cursor: { line: state.cursor.line, col } }
}

export const f: FindMotionEntry = { meta: fMeta, execute: executeF, inclusive: true }
