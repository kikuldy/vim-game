import type { BufferState, CommandMeta } from '../types'
import { fromFlatIdx, toFlatIdx } from '../buffer-utils'

export const pMeta: CommandMeta = {
  key: 'p',
  name: 'paste after',
  mnemonic: '"p" for put (vim\'s word for paste)',
  category: 'operator',
  description: 'Paste the register content after the cursor',
  examples: [
    { before: '|world', after: '|hello world' },
  ],
}

export const PMeta: CommandMeta = {
  key: 'P',
  name: 'paste before',
  mnemonic: 'capital "P" — put before the cursor',
  category: 'operator',
  description: 'Paste the register content before the cursor',
  examples: [
    { before: 'world|', after: 'worldhello |' },
  ],
}

/** Paste a linewise register (ends with \n) after the current line. */
function pasteLinewise(buf: BufferState, text: string, before: boolean): BufferState {
  const content = text.endsWith('\n') ? text.slice(0, -1) : text
  const newLines = content.split('\n')
  const insertAt = before ? buf.cursor.line : buf.cursor.line + 1
  const lines = [
    ...buf.lines.slice(0, insertAt),
    ...newLines,
    ...buf.lines.slice(insertAt),
  ]
  return { lines, cursor: { line: insertAt, col: 0 } }
}

/** Paste a character-wise register after/before the cursor. */
function pasteCharwise(buf: BufferState, text: string, after: boolean): BufferState {
  const flatText = buf.lines.join('\n')
  const insertIdx = toFlatIdx(buf.lines, buf.cursor.line, buf.cursor.col) + (after ? 1 : 0)
  const newText = flatText.slice(0, insertIdx) + text + flatText.slice(insertIdx)
  const newLines = newText === '' ? [''] : newText.split('\n')
  // Cursor lands at the start of inserted text, or end of it for `p`
  const cursorIdx = after ? insertIdx + text.length - 1 : insertIdx
  const cursor = fromFlatIdx(newLines, Math.max(0, cursorIdx))
  return { lines: newLines, cursor }
}

export function pasteAfter(buf: BufferState, register: string): BufferState {
  if (register.endsWith('\n')) return pasteLinewise(buf, register, false)
  return pasteCharwise(buf, register, true)
}

export function pasteBefore(buf: BufferState, register: string): BufferState {
  if (register.endsWith('\n')) return pasteLinewise(buf, register, true)
  return pasteCharwise(buf, register, false)
}
