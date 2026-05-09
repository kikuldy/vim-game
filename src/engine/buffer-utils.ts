import type { BufferState } from './types'

// ─── Flat-index utilities ────────────────────────────────────────────────────
// Many operations are simpler on a single flat string where newlines are one
// character. These helpers convert between (line, col) and flat indices.

export function toFlatIdx(lines: ReadonlyArray<string>, line: number, col: number): number {
  let idx = 0
  for (let l = 0; l < line; l++) idx += (lines[l]?.length ?? 0) + 1
  return idx + col
}

export function fromFlatIdx(
  lines: ReadonlyArray<string>,
  idx: number,
): { line: number; col: number } {
  let remaining = idx
  for (let l = 0; l < lines.length; l++) {
    const len = lines[l]?.length ?? 0
    if (remaining < len) return { line: l, col: remaining }
    if (remaining === len) {
      if (l === lines.length - 1) return { line: l, col: Math.max(0, len - 1) }
      if (len === 0) return { line: l, col: 0 }
    }
    remaining -= len + 1
    if (remaining < 0) return { line: l + 1, col: 0 }
  }
  const last = lines.length - 1
  return { line: last, col: Math.max(0, (lines[last]?.length ?? 1) - 1) }
}

// ─── Range extraction ────────────────────────────────────────────────────────

/**
 * Given two cursor positions and a motion's inclusivity, return the flat
 * [start, end] range (both inclusive) that an operator should act on.
 */
export function operatorRange(
  buf: BufferState,
  motionResult: BufferState,
  inclusive: boolean,
): { start: number; end: number } {
  const startIdx = toFlatIdx(buf.lines, buf.cursor.line, buf.cursor.col)
  let endIdx = toFlatIdx(motionResult.lines, motionResult.cursor.line, motionResult.cursor.col)

  const forward = endIdx >= startIdx

  if (forward) {
    if (!inclusive) endIdx-- // exclusive: don't include the landing character
    return { start: startIdx, end: endIdx }
  } else {
    // backward motion: swap so start < end
    if (!inclusive) return { start: endIdx, end: startIdx - 1 }
    return { start: endIdx, end: startIdx }
  }
}

// ─── Buffer text helpers ─────────────────────────────────────────────────────

export function bufferToString(buf: BufferState): string {
  return buf.lines.join('\n')
}

export function stringToBuffer(text: string, cursor: { line: number; col: number }): BufferState {
  return { lines: text.split('\n'), cursor }
}

/** Delete flat range [start, end] (both inclusive) and return new BufferState. */
export function deleteRange(buf: BufferState, start: number, end: number): BufferState {
  const text = bufferToString(buf)
  const newText = text.slice(0, start) + text.slice(end + 1)
  const newLines = newText === '' ? [''] : newText.split('\n')
  const cursor = fromFlatIdx(newLines, Math.min(start, newText.length > 0 ? newText.length - 1 : 0))
  return { lines: newLines, cursor }
}

/** Extract text in flat range [start, end] (both inclusive). */
export function extractRange(buf: BufferState, start: number, end: number): string {
  return bufferToString(buf).slice(start, end + 1)
}
