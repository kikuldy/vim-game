import type { BufferState, CommandMeta } from '../types'

export const dMeta: CommandMeta = {
  key: 'd',
  name: 'delete',
  mnemonic: '"d" for delete',
  category: 'operator',
  description: 'Delete text from cursor to where the motion takes you',
  examples: [
    { before: '|hello world', after: '|world' },
    { before: '|hello world', after: '|' },
  ],
  combinesWith: ['w', 'b', 'e', '$', '0', 'f', 'iw'],
}

export const ddMeta: CommandMeta = {
  key: 'dd',
  name: 'delete line',
  mnemonic: 'double "d" — delete the whole line',
  category: 'operator',
  description: 'Delete the entire current line',
  examples: [
    { before: '|hello\nworld', after: '|world' },
    { before: 'hello\n|world', after: '|hello' },
  ],
}

/** Delete an entire line from the buffer. Returns the new buffer. */
export function deleteLine(buf: BufferState, count: number): BufferState {
  const lines = buf.lines.slice()
  const start = buf.cursor.line
  const end = Math.min(start + count - 1, lines.length - 1)
  lines.splice(start, end - start + 1)

  if (lines.length === 0) return { lines: [''], cursor: { line: 0, col: 0 } }

  const newLine = Math.min(start, lines.length - 1)
  const lineStr = lines[newLine] ?? ''
  return {
    lines,
    cursor: { line: newLine, col: Math.min(buf.cursor.col, Math.max(0, lineStr.length - 1)) },
  }
}

/** Extract the text of a line range (for yanking before deletion). */
export function extractLines(buf: BufferState, count: number): string {
  const start = buf.cursor.line
  const end = Math.min(start + count - 1, buf.lines.length - 1)
  return buf.lines.slice(start, end + 1).join('\n') + '\n'
}
