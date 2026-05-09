import type { BufferState } from './types'

/**
 * Parse a string into a BufferState. Use "|" to mark cursor position.
 * Multi-line buffers are separated by "\n".
 *
 * Examples:
 *   buf('hel|lo')         → lines: ['hello'], cursor: { line:0, col:3 }
 *   buf('foo\n|bar')      → lines: ['foo','bar'], cursor: { line:1, col:0 }
 */
export function buf(text: string): BufferState {
  const rawLines = text.split('\n')
  let cursor = { line: 0, col: 0 }
  const lines = rawLines.map((line, lineIdx) => {
    const col = line.indexOf('|')
    if (col !== -1) {
      cursor = { line: lineIdx, col }
      return line.slice(0, col) + line.slice(col + 1)
    }
    return line
  })
  return { lines, cursor }
}

/** Inverse of buf(): serialise a BufferState back to a "|"-annotated string. */
export function bufStr(state: BufferState): string {
  return state.lines
    .map((line, i) => {
      if (i === state.cursor.line) {
        return line.slice(0, state.cursor.col) + '|' + line.slice(state.cursor.col)
      }
      return line
    })
    .join('\n')
}
